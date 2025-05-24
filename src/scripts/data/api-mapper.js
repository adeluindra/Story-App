export const mapStory = (story) => ({
  id: story.id,
  name: story.name,
  description: story.description,
  photoUrl: story.photoUrl || story.photo || '',
  createdAt: story.createdAt,
  lat: story.lat,
  lon: story.lon,
});

export const mapStories = (stories) => stories.map(mapStory);