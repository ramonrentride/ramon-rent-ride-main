import { useI18n } from '@/lib/i18n';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Mountain, ExternalLink, Loader2 } from 'lucide-react';

// Default trails as fallback
const defaultTrails = [
  {
    id: '1',
    name: 'Mount Ardon Trail',
    nameHe: 'מסלול הר ארדון',
    description: 'An easy and comfortable trail suitable for beginners',
    descriptionHe: 'מסלול קל ונוח המתאים למתחילים',
    difficulty: 'easy' as const,
    duration: '2-3',
    distance: '12',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=30.5983,34.8017&travelmode=bicycling',
    komootUrl: 'https://www.komoot.com/tour/ramon-crater',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
  },
  {
    id: '2',
    name: 'Colorful Hills Loop',
    nameHe: 'לולאת הגבעות הצבעוניות',
    description: 'Moderate trail with stunning colorful views',
    descriptionHe: 'מסלול בינוני עם נופים צבעוניים מרהיבים',
    difficulty: 'moderate' as const,
    duration: '3-4',
    distance: '18',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=30.6123,34.8234&travelmode=bicycling',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
  },
  {
    id: '3',
    name: 'Grand Canyon Trail',
    nameHe: 'מסלול הקניון הגדול',
    description: 'Challenging trail for experienced riders',
    descriptionHe: 'מסלול מאתגר לרוכבים מנוסים',
    difficulty: 'hard' as const,
    duration: '4-5',
    distance: '25',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=30.5856,34.7891&travelmode=bicycling',
    komootUrl: 'https://www.komoot.com/tour/grand-canyon-ramon',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800'
  },
  {
    id: '4',
    name: 'Sunrise Trail',
    nameHe: 'מסלול הזריחה',
    description: 'Short and easy trail, perfect for sunrise',
    descriptionHe: 'מסלול קצר וקל, מושלם לזריחה',
    difficulty: 'easy' as const,
    duration: '1-2',
    distance: '8',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=30.6045,34.8156&travelmode=bicycling',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'
  }
];

export function RecommendedTrails() {
  const { t, isRTL } = useI18n();
  const { data: trailsData, isLoading } = useSiteContent('trails');
  
  // Transform CMS data or use defaults
  const trails = trailsData && trailsData.length > 0
    ? trailsData
        .filter(trail => trail.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(trail => ({
          id: trail.id,
          name: trail.valueEn || '',
          nameHe: trail.valueHe || '',
          description: trail.metadata?.descriptionEn || '',
          descriptionHe: trail.metadata?.descriptionHe || '',
          difficulty: (trail.metadata?.difficulty || 'moderate') as 'easy' | 'moderate' | 'hard',
          duration: trail.metadata?.duration || '2-3',
          distance: trail.metadata?.distance || '10',
          googleMapsUrl: trail.metadata?.googleMapsUrl || '#',
          komootUrl: trail.metadata?.komootUrl,
          image: trail.metadata?.image || trail.metadata?.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        }))
    : defaultTrails;
  
  const getDifficultyConfig = (difficulty: 'easy' | 'moderate' | 'hard') => {
    const config = {
      easy: {
        label: t('easy'),
        color: 'bg-success/20 text-success border-success/30'
      },
      moderate: {
        label: t('moderate'),
        color: 'bg-warning/20 text-warning border-warning/30'
      },
      hard: {
        label: t('hard'),
        color: 'bg-destructive/20 text-destructive border-destructive/30'
      }
    };
    return config[difficulty];
  };

  if (isLoading) {
    return (
      <section className="py-20 px-6 bg-gradient-to-b from-accent/5 via-background to-primary/10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-accent/5 via-background to-primary/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <Mountain className="absolute top-10 left-10 w-64 h-64 text-primary" />
        <Mountain className="absolute bottom-10 right-10 w-48 h-48 text-accent" />
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            🗺️ {t('recommendedTrails')}
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('trailsDescription')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {trails.map((trail, index) => {
            const difficultyConfig = getDifficultyConfig(trail.difficulty);
            const trailName = isRTL ? trail.nameHe : trail.name;
            const trailDescription = isRTL ? trail.descriptionHe : trail.description;
            
            return (
              <div
                key={trail.id}
                className="group glass-card rounded-2xl overflow-hidden card-hover animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Trail Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={trail.image}
                    alt={trailName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Difficulty Badge */}
                  <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'}`}>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${difficultyConfig.color}`}>
                      {difficultyConfig.label}
                    </span>
                  </div>
                  
                  {/* Trail Name Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-xl font-bold text-white">
                      {trailName}
                    </h4>
                  </div>
                </div>

                {/* Trail Info */}
                <div className="p-6">
                  <p className="text-muted-foreground mb-4">
                    {trailDescription}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 mb-6 text-sm">
                    <div className="flex items-center gap-2 text-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{trail.duration} {t('hours')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{trail.distance} {t('km')}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <a href={trail.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="btn-hero gap-2">
                        <MapPin className="w-4 h-4" />
                        {t('openGoogleMaps')}
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                    {trail.komootUrl && (
                      <a href={trail.komootUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2">
                          <Mountain className="w-4 h-4" />
                          Komoot
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
