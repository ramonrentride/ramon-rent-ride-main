import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Users, ChevronLeft, ChevronRight, Sparkles, Bike, BookOpen, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WeatherWidget } from '@/components/WeatherWidget';
import { FAQ } from '@/components/FAQ';
import { RecommendedTrails } from '@/components/RecommendedTrails';
import { useI18n } from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSiteContent } from '@/hooks/useSiteContent';
import { getLocalizedValue, getLocalizedMeta, getContentImage } from '@/lib/cmsHelpers';
import { Skeleton } from '@/components/ui/skeleton';
import { iconComponents } from '@/components/admin/editors/IconPicker';
import { PreLaunchBanner } from '@/components/PreLaunchBanner';
import { WaitingListDialog } from '@/components/WaitingListDialog';
import { usePreLaunchMode } from '@/hooks/usePreLaunchMode';
import heroImage from '@/assets/hero-crater.jpg';
import natureBg from '@/assets/nature-bg.jpg';

// Default fallbacks
import animalIbex from '@/assets/animal-ibex.jpg';
import animalVulture from '@/assets/animal-vulture.jpg';
import animalEagle from '@/assets/animal-eagle.jpg';
import animalFox from '@/assets/animal-fox.jpg';
import desertCycling from '@/assets/desert-cycling.jpg';
import desertTrail from '@/assets/desert-trail.jpg';
import desertSunset from '@/assets/desert-sunset.jpg';

const Index = () => {
  const { t, isRTL } = useI18n();
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [waitingListOpen, setWaitingListOpen] = useState(false);
  const { isPreLaunchMode } = usePreLaunchMode();

  // Fetch CMS data
  const { data: featuresData, isLoading: featuresLoading } = useSiteContent('homepage.features');
  const { data: animalsData, isLoading: animalsLoading } = useSiteContent('homepage.nature');

  // Default features fallback
  const defaultFeatures = [
    { icon: 'Bike', title: t('professionalBikes'), description: t('professionalBikesDesc'), image: desertCycling, bgColor: '' },
    { icon: 'Map', title: t('markedTrails'), description: t('markedTrailsDesc'), image: desertTrail, bgColor: '' },
    { icon: 'UtensilsCrossed', title: t('desertPicnic'), description: t('desertPicnicDesc'), image: desertSunset, bgColor: '' }
  ];

  // Default animals fallback
  const defaultAnimals = [
    { id: 'ibex', name: t('nubianIbex'), emoji: '🦌', image: animalIbex, description: t('ibexDescription') },
    { id: 'vulture', name: t('vultures'), emoji: '🦅', image: animalVulture, description: t('vultureDescription') },
    { id: 'eagle', name: t('eagles'), emoji: '🦉', image: animalEagle, description: t('eagleDescription') },
    { id: 'fox', name: t('foxes'), emoji: '🦊', image: animalFox, description: t('foxDescription') },
  ];

  // Map CMS data or use defaults
  const features = featuresData && featuresData.length > 0
    ? featuresData.filter(f => f.isActive).map((item, index) => ({
      icon: item.metadata?.icon || 'Bike',
      title: getLocalizedValue(item, isRTL),
      description: getLocalizedMeta(item, 'description', isRTL),
      image: item.metadata?.image || [desertCycling, desertTrail, desertSunset][index % 3],
      bgColor: item.metadata?.bgColor || ''
    }))
    : defaultFeatures;

  const animals = animalsData && animalsData.length > 0
    ? animalsData.filter(a => a.isActive).map(item => ({
      id: item.contentKey,
      name: getLocalizedValue(item, isRTL),
      emoji: item.metadata?.emoji || '🦌',
      image: getContentImage(item),
      description: getLocalizedMeta(item, 'description', isRTL)
    }))
    : defaultAnimals;

  return (
    <div className="min-h-screen bg-background">
      {/* Pre-Launch Banner */}
      <PreLaunchBanner />

      {/* Waiting List Dialog */}
      <WaitingListDialog open={waitingListOpen} onOpenChange={setWaitingListOpen} />

      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: `url(${heroImage})`
        }} />
        <div className="absolute inset-0 crater-overlay" />

        <div className="relative z-10 h-full flex flex-col">
          {/* Top Bar - Fixed at top */}
          <div className="absolute top-0 left-0 right-0 z-20 px-4 md:px-6 py-3 md:py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              {/* Logo placeholder */}
              <div className="hidden md:block" />

              {/* Weather Widget - Hidden on mobile */}
              <div className="hidden sm:block flex-shrink-0">
                <WeatherWidget />
              </div>

              {/* Logo - Always visible, centered on mobile */}
              <div className="flex items-center gap-2 md:gap-3 mx-auto md:mx-0">
                <div>
                  <h1 className="text-base md:text-xl font-bold text-white text-left">{t('bikeRentRamon')}</h1>
                  <p className="text-xs md:text-sm text-white/80 text-left">{t('bikeRentalCrater')}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl md:text-2xl">🚴</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="flex-1 px-4 md:px-6 flex flex-col items-center justify-center pt-16 md:pt-20">
            <div className="max-w-3xl w-full">
              <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 md:mb-6 leading-tight text-center">
                {t('autonomousBikeRental')}
              </h2>
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-center">
                <span className="text-gradient">{t('onTwoWheels')}</span>
              </h3>

              <p className="text-base md:text-xl text-white/90 mb-6 md:mb-8 leading-relaxed text-center max-w-2xl mx-auto px-2">
                {t('heroDescription')}
              </p>

              <div className="flex flex-col gap-3 items-center justify-center">
                {isPreLaunchMode ? (
                  <Button
                    className="btn-hero text-base md:text-lg px-6 md:px-8 py-4 md:py-6 gap-2 w-full sm:w-auto"
                    onClick={() => setWaitingListOpen(true)}
                  >
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                    הצטרפות לרשימת המתנה
                    <ChevronIcon className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                ) : (
                  <Link to="/booking" className="w-full sm:w-auto">
                    <Button className="btn-hero text-base md:text-lg px-6 md:px-8 py-4 md:py-6 gap-2 w-full sm:w-auto">
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                      {t('bookNow')}
                      <ChevronIcon className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </Link>
                )}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link to="/guest" className="w-full sm:w-auto">
                    <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-sm md:text-lg px-4 md:px-8 py-3 md:py-6 gap-2 w-full sm:w-auto">
                      <Users className="w-4 h-4 md:w-5 md:h-5" />
                      🚴 {t('riderEntry')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-primary/10 via-accent/5 to-background relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">✨ {t('whyChooseUs')}</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t('featuresDescription')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuresLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card rounded-2xl p-8">
                    <Skeleton className="w-16 h-16 rounded-full mx-auto mb-6" />
                    <Skeleton className="h-6 w-32 mx-auto mb-3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mx-auto mt-2" />
                  </div>
                ))}
              </>
            ) : (
              features.map((feature, index) => {
                const IconComponent = iconComponents[feature.icon];
                return (
                  <div
                    key={index}
                    className={`glass-card rounded-2xl overflow-hidden card-hover animate-fade-in ${feature.bgColor}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* תמונה עם אפקט זום */}
                    <div className="h-48 overflow-hidden">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    {/* אייקון וטקסט */}
                    <div className="p-6 text-center">
                      {IconComponent ? (
                        <IconComponent className="w-10 h-10 text-primary mx-auto mb-4" />
                      ) : (
                        <span className="text-3xl mb-4 block">{feature.icon}</span>
                      )}
                      <h4 className="text-xl font-bold text-foreground mb-3">{feature.title}</h4>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Ibex Section - Meeting Nature */}
      <section
        className="py-16 px-6 relative overflow-hidden"
        style={{ backgroundImage: `url(${natureBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              🦌 {t('meetingNature')}
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {t('natureDescription')}
            </p>
          </div>

          {/* Animal Buttons Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {animalsLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-2xl" />
                ))}
              </>
            ) : (
              animals.map((animal, index) => (
                <button
                  key={animal.id}
                  onClick={() => setSelectedAnimal(animal.id)}
                  className="group relative rounded-2xl overflow-hidden shadow-xl card-hover aspect-square"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={animal.image}
                    alt={animal.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                    <span className="text-3xl mb-2 block">{animal.emoji}</span>
                    <span className="text-white font-bold text-lg">{animal.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Animal Info Dialog */}
          <Dialog open={!!selectedAnimal} onOpenChange={() => setSelectedAnimal(null)}>
            <DialogContent className="max-w-lg">
              {selectedAnimal && (() => {
                const animal = animals.find(a => a.id === selectedAnimal);
                if (!animal) return null;
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-2xl">
                        <span>{animal.emoji}</span>
                        <span>{animal.name}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <img
                      src={animal.image}
                      alt={animal.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <DialogDescription className="text-base leading-relaxed">
                      {animal.description}
                    </DialogDescription>
                  </>
                );
              })()}
            </DialogContent>
          </Dialog>
        </div>
      </section>


      {/* Recommended Trails Section */}
      <RecommendedTrails />

      {/* FAQ Section */}
      <FAQ />

      {/* Bottom CTA Section */}
      <section className="py-12 px-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-2xl mx-auto text-center">
          {isPreLaunchMode ? (
            <Button
              className="btn-hero text-lg px-10 py-6 gap-2"
              onClick={() => setWaitingListOpen(true)}
            >
              <Sparkles className="w-5 h-5" />
              🌟 הצטרפו לרשימת המתנה!
              <ChevronIcon className="w-5 h-5" />
            </Button>
          ) : (
            <Link to="/booking">
              <Button className="btn-hero text-lg px-10 py-6 gap-2">
                <Sparkles className="w-5 h-5" />
                🌟 {t('readyForAdventure')} - {t('bookNow')}
                <ChevronIcon className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-card to-primary/10 border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-xl">🚴</span>
              </div>
              <div>
                <h4 className="font-bold text-foreground">{t('bikeRentRamon')}</h4>
                <p className="text-sm text-muted-foreground">{t('bikeRentalCrater')}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 md:gap-6 text-muted-foreground items-center">
              <a
                href="https://wa.me/972503303376"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors flex items-center gap-2 bg-green-500/10 px-3 py-2 rounded-lg hover:bg-green-500/20"
              >
                <span className="text-green-500">💬</span> WhatsApp
              </a>
              <a
                href="https://waze.com/ul?q=Mitzpe%20Ramon"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors flex items-center gap-2 bg-blue-500/10 px-3 py-2 rounded-lg hover:bg-blue-500/20"
              >
                <Navigation className="w-4 h-4 text-blue-500" /> Waze
              </a>
              <a href="mailto:info@ramonrentride.co.il" className="hover:text-primary transition-colors flex items-center gap-2">
                ✉️ info@ramonrentride.co.il
              </a>
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                  🔐 {t('adminLogin')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2024 {t('bikeRentRamon')}. {t('allRightsReserved')}. 🏜️
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
