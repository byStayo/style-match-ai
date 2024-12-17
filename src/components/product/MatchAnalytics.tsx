import { Card } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer 
} from "recharts";
import { ProductMatch } from "@/types/product";

interface MatchAnalyticsProps {
  matches: ProductMatch[];
}

export const MatchAnalytics = ({ matches }: MatchAnalyticsProps) => {
  // Calculate match score distribution
  const matchScoreData = matches.reduce((acc, match) => {
    const score = Math.round(match.match_score * 100);
    const bracket = Math.floor(score / 10) * 10;
    const existingBracket = acc.find(item => item.range === `${bracket}-${bracket + 9}%`);
    
    if (existingBracket) {
      existingBracket.count++;
    } else {
      acc.push({ range: `${bracket}-${bracket + 9}%`, count: 1 });
    }
    
    return acc;
  }, [] as { range: string; count: number }[]).sort((a, b) => {
    return parseInt(a.range) - parseInt(b.range);
  });

  // Calculate store distribution
  const storeData = matches.reduce((acc, match) => {
    const existingStore = acc.find(item => item.store === match.store_name);
    
    if (existingStore) {
      existingStore.count++;
    } else {
      acc.push({ store: match.store_name, count: 1 });
    }
    
    return acc;
  }, [] as { store: string; count: number }[]);

  return (
    <div className="space-y-6">
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
          <BarChart data={storeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="store" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};