//manifest.json seams to be not working with nextjs 14.0.4

import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        "scope": "/",
        "lang": "fr-FR",
        "short_name": "TLN",
        "name": "TEC LIVE NETWORK",
        "description": "TEC LIVE NETWORK",
        // "theme_color": "#fbf4e2",
        // "background_color": "#fbf4e2",
        "display": "standalone",
        "orientation": "portrait-primary",
        "start_url": "/",
        "icons": [
            {
                "src": "https://live.ckonrad.io/favicon.ico",
                "sizes": "256x256",
                "type": "image/png",
                "purpose": "any"
            }
        ],
        "categories": [
            "mobility"
        ]
    }

}