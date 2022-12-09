import { apiHooks } from '../client/apiClient'
import { List, ListItem } from '@mui/material'
import { StoryApiEntry } from '../common/api'
import { Link } from 'react-router-dom'

export default function StoriesIndex() {
  const { data } = apiHooks.useQuery('/stories')
  if (!data) return null

  return (
    <List>
      {Object.entries(data.stories).flatMap(([k, v]: [string, StoryApiEntry]) =>
        v.stories.map((s) => (
          <Link key={s.storyId} to={'/stories/' + s.storyId}>
            <ListItem>{s.storyId}</ListItem>
          </Link>
        ))
      )}

      <ListItem></ListItem>
    </List>
  )
}
