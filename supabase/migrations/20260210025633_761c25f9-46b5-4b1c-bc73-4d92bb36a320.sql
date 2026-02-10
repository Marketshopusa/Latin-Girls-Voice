
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/apng',
  'video/mp4', 'video/webm', 'video/quicktime'
]
WHERE id = 'character-images';
