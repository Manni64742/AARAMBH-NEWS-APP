import React from 'react'
import { youtubeEmbedUrl } from '../utils/youtube'

export function YouTubePlayer({ videoId }: { videoId: string }) {
  return React.createElement(
    'iframe',
    {
      src: youtubeEmbedUrl(videoId, true),
      title: 'YouTube Player',
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowFullScreen: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      style: {
        flex: 1,
        width: '100%',
        height: '100%',
        border: 0,
        borderRadius: 10,
        backgroundColor: '#000',
      },
    } as any,
  )
}