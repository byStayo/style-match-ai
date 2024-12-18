CREATE OR REPLACE FUNCTION increment_upload_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET upload_count = COALESCE(upload_count, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;