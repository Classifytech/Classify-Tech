export interface PhotoItem {
  id: string;
  title: string;
  category: 'Nightscape' | 'Portrait' | 'Architecture' | 'Macro' | 'Street';
  device: string;
  sensor: string;
  exif: {
    focalLength: string;
    aperture: string;
    shutter: string;
    iso: string;
    lens: string;
  };
  thumbUrl: string;
  highResUrl: string;
  description: string;
  rating: string;
}

export const defaultPhotographyPortfolio: PhotoItem[] = [
  {
    id: 'night-cyber-metropolis',
    title: 'Neon Cyber Metropolis & Low-Light Dynamic Range',
    category: 'Nightscape',
    device: 'iQOO Neo 9 Pro 5G',
    sensor: '50MP Sony IMX920 VCS Bionic (1/1.49", OIS)',
    exif: {
      focalLength: '23mm (35mm equiv.)',
      aperture: 'f/1.88',
      shutter: '1/15s Handheld Night Mode',
      iso: 'ISO 640',
      lens: '7P Optical Glass with Zeiss T* Coating'
    },
    thumbUrl: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=800&q=80',
    highResUrl: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=2400&q=95',
    description: 'Captured handheld in deep night urban lighting. Notice zero highlight blooming on neon signs with crisp dark tone preservation and optical image stabilization sharpness.',
    rating: '9.6/10 Low-Light'
  },
  {
    id: 'golden-hour-cinematic-portrait',
    title: 'Golden Hour 50mm Optical Portrait & Natural Bokeh',
    category: 'Portrait',
    device: 'OnePlus 13R / Nord 4 5G',
    sensor: '50MP Sony LYT-600 OIS (1/1.95")',
    exif: {
      focalLength: '50mm Telephoto Crop',
      aperture: 'f/1.8 Simulated f/2.0 Depth',
      shutter: '1/640s Daylight',
      iso: 'ISO 50',
      lens: 'Aspherical High-Index Lens'
    },
    thumbUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    highResUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=2400&q=95',
    description: 'Crisp subject separation with natural organic edge transition around stray hair. Skin tones remain true to life without aggressive AI over-smoothing.',
    rating: '9.4/10 Skin Detail'
  },
  {
    id: 'ultrawide-minimal-geometry',
    title: 'Modern Architecture Lines & Zero Distortion Ultra-Wide',
    category: 'Architecture',
    device: 'POCO F6 5G',
    sensor: '8MP Sony IMX355 Ultra-Wide (119° FOV)',
    exif: {
      focalLength: '16mm Ultra-Wide Angle',
      aperture: 'f/2.2',
      shutter: '1/320s HDR Auto',
      iso: 'ISO 100',
      lens: 'Anti-Distortion Corner Correction'
    },
    thumbUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    highResUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=95',
    description: 'High-contrast structural facade demonstrating edge-to-edge clarity and geometric straight lines without barrel distortion.',
    rating: '9.1/10 Geometry'
  },
  {
    id: 'dew-macro-telephoto',
    title: 'Morning Flora Micro Details & Optical Macro',
    category: 'Macro',
    device: 'Redmi Note 14 Pro+ 5G',
    sensor: '50MP Light Fusion 800 Telephoto (2.5x Optical)',
    exif: {
      focalLength: '60mm Telemacro',
      aperture: 'f/2.0',
      shutter: '1/250s Natural Sunlight',
      iso: 'ISO 80',
      lens: 'Floating Telephoto Lens Group'
    },
    thumbUrl: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=800&q=80',
    highResUrl: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=2400&q=95',
    description: 'Sub-millimeter dew droplet resolution with microscopic light refraction and soft, creamy background bokeh.',
    rating: '9.7/10 Micro Texture'
  },
  {
    id: 'tokyo-rain-street-moment',
    title: 'Tokyo Rain Reflections & High Shutter Street Capture',
    category: 'Street',
    device: 'Samsung Galaxy S24 FE 5G',
    sensor: '50MP Samsung ISOCELL Dual Pixel (OIS, 1/1.56")',
    exif: {
      focalLength: '24mm Wide Angle',
      aperture: 'f/1.8',
      shutter: '1/500s Zero Shutter Lag',
      iso: 'ISO 250',
      lens: 'ProVisual Engine HDR Super'
    },
    thumbUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    highResUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=2400&q=95',
    description: 'Wet asphalt reflection dynamic range test. Perfect freeze of raindrops with zero motion blur and wide spectral color accuracy.',
    rating: '9.5/10 Street Dynamic'
  },
  {
    id: 'astrophotography-milky-way',
    title: 'Deep Sky Astrophotography & Long Exposure Core',
    category: 'Nightscape',
    device: 'Realme GT 6 5G',
    sensor: '50MP Sony LYT-808 (1/1.4", OIS)',
    exif: {
      focalLength: '23mm (35mm equiv.)',
      aperture: 'f/1.69',
      shutter: '30s Star Tracker Tripod Mode',
      iso: 'ISO 3200',
      lens: 'Super OIS Dual Stabilization'
    },
    thumbUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
    highResUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2400&q=95',
    description: 'Multi-frame stacking astro mode showcasing galactic dust clouds with low thermal sensor noise and stellar point sharpness.',
    rating: '9.8/10 Astro Capture'
  }
];
