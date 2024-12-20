import { Card } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { ProductMatch } from "@/types/product";

interface MatchAnalyticsProps {
  matches: ProductMatch[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const MatchAnalytics = ({ matches }: MatchAnalyticsProps) => {
  // Calculate match score distribution
  const matchScoreData = matches.reduce((acc, match) => {
    const score = Math.round(match.match_score * 100);
    const bracket = Math.floor(score / 10) * 10;
    const existingBracket = acc.find(item => item.range === `${bracket}-${bracket + 9}%`);
    
    if (existingBracket) {
      existingBracket.count++;
      existingBracket.value = existingBracket.count;
    } else {
      acc.push({ 
        range: `${bracket}-${bracket + 9}%`, 
        count: 1,
        value: 1 
      });
    }
    
    return acc;
  }, [] as { range: string; count: number; value: number }[]).sort((a, b) => {
    return parseInt(a.range) - parseInt(b.range);
  });

  // Calculate store distribution
  const storeData = matches.reduce((acc, match) => {
    const existingStore = acc.find(item => item.name === match.store_name);
    
    if (existingStore) {
      existingStore.count++;
      existingStore.value = existingStore.count;
    } else {
      acc.push({ 
        name: match.store_name, 
        count: 1,
        value: 1 
      });
    }
    
    return acc;
  }, [] as { name: string; count: number; value: number }[]);

  // Calculate confidence scores over time
  const confidenceData = matches
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
    .map(match => ({
      date: new Date(match.created_at || 0).toLocaleDateString(),
      styleMatch: Math.round(match.confidence_scores?.style_match * 100) || 0,
      priceMatch: Math.round(match.confidence_scores?.price_match * 100) || 0,
      availability: Math.round(match.confidence_scores?.availability * 100) || 0,
    }));

  // Calculate style tags distribution
  const styleTagsData = matches.reduce((acc, match) => {
    if (!match.style_tags) return acc;
    
    match.style_tags.forEach(tag => {
      const existingTag = acc.find(item => item.name === tag);
      if (existingTag) {
        existingTag.count++;
        existingTag.value = existingTag.count;
      } else {
        acc.push({ name: tag, count: 1, value: 1 });
      }
    });
    
    return acc;
  }, [] as { name: string; count: number; value: number }[])
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Match Score Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={matchScoreData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Matches by Store</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={storeData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {storeData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Confidence Scores Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={confidenceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="styleMatch" stroke="#3b82f6" name="Style Match" />
            <Line type="monotone" dataKey="priceMatch" stroke="#10b981" name="Price Match" />
            <Line type="monotone" dataKey="availability" stroke="#f59e0b" name="Availability" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Style Tags</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={styleTagsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};