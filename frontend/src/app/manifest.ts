import { MetadataRoute } from 'next'

export const dynamic = 'force-static';
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kolayentegrasyon Paneli',
    short_name: 'Kolayentegrasyon',
    description: 'Modern ajanslar için SaaS yönetim platformu',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/images/logo-ocw.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/logo-ocw.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
