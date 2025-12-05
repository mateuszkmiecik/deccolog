import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useRef, useEffect } from 'preact/hooks'

export type TagItem = {
  id: number;
  name: string
}

interface TagsResponse {
  tags: TagItem[]
}



async function fetchTagsByQuery(query: string) {
  const params = new URLSearchParams({ q: query })

  const response = await fetch(`/api/tags?${params}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (response.ok) {
    const body = (await response.json()) as TagItem[];
    return body;
  }

  throw new Error('Could not fetch tags');
}

export function useTags() {
  const queryClient = useQueryClient();

  const [selectedTags, setSelectedTags] = useState<TagItem[]>([])
  const debounceTimerRef = useRef<number | null>(null)

  const [fetchQuery, setFetchQuery] = useState('');

  const { data: tagSuggestions = [], isLoading } = useQuery({
    queryKey: ['tags', fetchQuery],
    queryFn: () => fetchTagsByQuery(fetchQuery),
    enabled: fetchQuery.length > 0
  });

  const setTagInputValue = useCallback((query: string) => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = window.setTimeout(() => {
      setFetchQuery(query)
    }, 300) as unknown as number
  }, [])

  const reset = () => {
    setFetchQuery("");
    queryClient.resetQueries({
      queryKey: ['tags']
    })
  };

  const saveTagInDB = async (tag: string) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        credentials: 'include',
        body: tag
      });
      if (!response.ok) {
        throw new Error('there was a problem with adding a tag');
      }
      const body = (await response.json()) as TagItem;
      return body;
    } catch(err) {
      console.error(err);
    }
  }

  const saveAndAddTag = async (tag: string) => {
    const addedTag = await saveTagInDB(tag);
    if (!addedTag) return;
    addTag(addedTag)
  }

  const addTag = useCallback((tag: TagItem) => {
    setSelectedTags(prev => {
      if (!prev.includes(tag)) {
        return [...prev, tag]
      }
      return prev
    })
    reset()
  }, [])

  const removeTag = useCallback((tag: TagItem) => {
    setSelectedTags(prev => prev.filter(t => t.id !== tag.id))
  }, [])

  const clearTags = useCallback(() => {
    setSelectedTags([])
    reset()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    tagSuggestions,
    isLoading,
    selectedTags,
    fetchQuery,
    setTagInputValue,
    addTag,
    saveAndAddTag,
    removeTag,
    clearTags,
    setSelectedTags,
  }
}
