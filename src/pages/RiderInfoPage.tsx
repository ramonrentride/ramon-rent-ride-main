import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Bike, Wrench, AlertTriangle, Heart, Zap, Sun, Shield, ThumbsUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSiteContent } from '@/hooks/useSiteContent';
import { getLocalizedValue, getLocalizedMeta } from '@/lib/cmsHelpers';
import { Skeleton } from '@/components/ui/skeleton';
import { iconComponents } from '@/components/admin/editors/IconPicker';
import heroImage from '@/assets/hero-crater.jpg';
import type { ComponentType } from 'react';

// Helper to get Lucide icon component from name
const getLucideIcon = (iconName: string | undefined): ComponentType<{ className?: string }> | null => {
  if (!iconName) return null;
  return iconComponents[iconName] || null;
};

// Color schemes for tip cards
const tipColorSchemes = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-600' },
  { bg: 'bg-amber-500/10', border: 'border-amber-500/20', iconBg: 'bg-amber-500/20', iconColor: 'text-amber-600' },
  { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-600' },
  { bg: 'bg-orange-500/10', border: 'border-orange-500/20', iconBg: 'bg-orange-500/20', iconColor: 'text-orange-600' },
  { bg: 'bg-green-500/10', border: 'border-green-500/20', iconBg: 'bg-green-500/20', iconColor: 'text-green-600' },
  { bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-600' },
];

const RiderInfoPage = () => {
  const { isRTL } = useI18n();

  // Fetch CMS data
  const { data: tipsData, isLoading: tipsLoading } = useSiteContent('riderGuide.tips');
  const { data: repairsData, isLoading: repairsLoading } = useSiteContent('riderGuide.repairs');

  // Default riding tips
  const defaultRidingTips = [
    {
      icon: 'Gauge',
      title: 'בדיקה לפני רכיבה',
      description: 'לפני שיוצאים - בודקים צמיגים, בלמים, וכיוון הכידון. זה לוקח 30 שניות ויכול להציל את הטיול!'
    },
    {
      icon: 'HardHat',
      title: 'קסדה תמיד!',
      description: 'הראש שלך שווה יותר מכל המהירות בעולם. קסדה = חובה. בלי ויכוחים!'
    },
    {
      icon: 'Droplets',
      title: 'מים מים מים',
      description: 'במדבר, הגוף מאבד מים בקצב מטורף. שתו לפחות חצי ליטר כל שעה. הגוף יגיד תודה!'
    },
    {
      icon: 'Sun',
      title: 'תזמון נכון',
      description: 'רוכבים בבוקר מוקדם או אחה"צ מאוחר. בין 11:00-15:00 השמש מטרלטת - עדיף להתחבא בצל!'
    },
    {
      icon: 'MapPin',
      title: 'שמרו על מסלול',
      description: 'המסלולים המסומנים בטוחים ומוכרים. יוצאים מהשביל? עלולים להיתקע או להזיק לטבע היקר!'
    },
    {
      icon: 'Squirrel',
      title: 'חיות בר',
      description: 'פגשתם יעל? מגניב! אבל שומרים מרחק, לא מאכילים, ולא מפחידים. הם היו פה לפנינו'
    }
  ];

  // Default bike repairs
  const defaultBikeRepairs = [
    {
      icon: 'Wrench',
      problem: 'פנצ\'ר בצמיג',
      solution: 'לא להיבהל! יש ערכת טלאים בכל אופניים. מוציאים את הפנימית, מוצאים את החור, טולאים ומנפחים!',
      difficulty: 'קל'
    },
    {
      icon: 'Link',
      problem: 'שרשרת נפלה',
      solution: 'קורה לכולם! מחזירים את השרשרת לגלגל השיניים, מסובבים את הפדלים לאט, והכל חוזר לעבוד.',
      difficulty: 'קל'
    },
    {
      icon: 'CircleSlash',
      problem: 'בלמים לא עובדים',
      solution: 'קודם כל - עוצרים ברגליים! בודקים אם הכבל מחובר. אם משהו נראה לא בסדר - מתקשרים לתמיכה!',
      difficulty: 'בינוני'
    },
    {
      icon: 'Settings',
      problem: 'כידון רופף',
      solution: 'מחפשים את הברגים בשטם ומהדקים עם אלן 5. לא חזק מדי - רק עד שזה מתייצב!',
      difficulty: 'קל'
    },
    {
      icon: 'ArrowUpDown',
      problem: 'מושב לא נוח',
      solution: 'גובה המושב צריך לאפשר רגל כמעט ישרה בפדל למטה. יש ידית שחרור מהיר!',
      difficulty: 'קל מאוד'
    },
    {
      icon: 'Cog',
      problem: 'הילוכים לא עוברים',
      solution: 'לפעמים הכבל נמתח. מנסים ללחוץ על המעבירים כמה פעמים. אם לא עוזר - רוכבים בהילוך שעובד!',
      difficulty: 'בינוני'
    }
  ];

  // Map CMS data or use defaults
  const ridingTips = tipsData && tipsData.length > 0
    ? tipsData.filter(t => t.isActive).map(item => ({
      icon: item.metadata?.icon || 'Bike',
      title: getLocalizedValue(item, isRTL),
      description: getLocalizedMeta(item, 'description', isRTL)
    }))
    : defaultRidingTips;

  const bikeRepairs = repairsData && repairsData.length > 0
    ? repairsData.filter(r => r.isActive).map(item => ({
      icon: item.metadata?.icon || 'Wrench',
      problem: getLocalizedValue(item, isRTL),
      solution: getLocalizedMeta(item, 'description', isRTL),
      difficulty: item.metadata?.difficulty || 'קל'
    }))
    : defaultBikeRepairs;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: `url(${heroImage})`
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />

        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="p-6">
            <Link to="/guest">
              <Button variant="ghost" className="text-white gap-2 hover:bg-white/20">
                <Home className="w-5 h-5" />
                {isRTL ? 'חזרה לאזור האישי' : 'Back to My Area'}
              </Button>
            </Link>
          </div>

          {/* Hero Content */}
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🚴‍♂️</div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                מדריך הרוכב המושלם
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                כל מה שצריך לדעת כדי ליהנות מרכיבה בטוחה ומהנה במכתש רמון! 🌵
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Riding Tips Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-background via-primary/5 to-accent/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-full mb-4">
              <Sun className="w-6 h-6 text-primary animate-spin" style={{ animationDuration: '10s' }} />
              <span className="font-bold text-primary">טיפים חמים מהמדבר</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              🎯 הוראות לרכיבה נכונה
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              עם הטיפים האלה, תהפכו מרוכבים סתם לרוכבי על! 🦸‍♂️
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tipsLoading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-8 border border-border">
                    <Skeleton className="w-16 h-16 rounded-2xl mx-auto mb-6" />
                    <Skeleton className="h-7 w-40 mx-auto mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-4/5 mx-auto" />
                  </div>
                ))}
              </>
            ) : (
              ridingTips.map((tip, index) => {
                const colorScheme = tipColorSchemes[index % tipColorSchemes.length];
                const IconComponent = getLucideIcon(tip.icon);

                return (
                  <div
                    key={index}
                    className={`rounded-2xl p-8 border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${colorScheme.bg} ${colorScheme.border}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${colorScheme.iconBg}`}>
                      {IconComponent ? (
                        <IconComponent className={`w-8 h-8 ${colorScheme.iconColor}`} />
                      ) : (
                        <Bike className={`w-8 h-8 ${colorScheme.iconColor}`} />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-4 text-center">
                      {tip.title}
                    </h3>
                    <p className="text-muted-foreground text-center leading-relaxed text-base">
                      {tip.description}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Bike Repairs Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-accent/10 via-secondary/10 to-primary/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/20 px-6 py-3 rounded-full mb-4">
              <Wrench className="w-6 h-6 text-accent animate-pulse" />
              <span className="font-bold text-accent-foreground">הפוך לטכנאי</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              🔧 תיקונים פשוטים שכל אחד יכול
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              אל תיתנו לתקלה קטנה להרוס את היום! הנה איך להתמודד כמו מקצוענים 💪
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {repairsLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                    <div className="flex gap-5">
                      <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-40 mb-3" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              bikeRepairs.map((repair, index) => {
                const IconComponent = getLucideIcon(repair.icon);
                const difficultyColor =
                  repair.difficulty === 'קל מאוד' ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' :
                    repair.difficulty === 'קל' ? 'bg-blue-500/20 text-blue-700 border-blue-500/30' :
                      'bg-amber-500/20 text-amber-700 border-amber-500/30';

                return (
                  <div
                    key={index}
                    className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex gap-5">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                        {IconComponent ? (
                          <IconComponent className="w-7 h-7 text-primary" />
                        ) : (
                          <Wrench className="w-7 h-7 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-lg font-bold text-foreground">
                            {repair.problem}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyColor}`}>
                            {repair.difficulty}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-sm">
                          {repair.solution}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Emergency Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-primary/10 to-destructive/10">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-8 border-2 border-destructive/30 bg-destructive/5">
            <div className="text-center mb-8">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4 animate-pulse" />
              <h2 className="text-3xl font-bold text-foreground mb-2">
                🆘 במקרה חירום
              </h2>
              <p className="text-muted-foreground">
                לא להיבהל! יש פתרון לכל בעיה
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  פציעה קלה
                </h3>
                <p className="text-muted-foreground text-sm">
                  יש ערכת עזרה ראשונה בכל עמדת אופניים. חיטוי + פלסטר = וממשיכים!
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  נתקעתם בשטח
                </h3>
                <p className="text-muted-foreground text-sm">
                  שולחים SOS מהאפליקציה או מתקשרים 050-123-4567. נגיע אליכם!
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  הרגשה לא טובה
                </h3>
                <p className="text-muted-foreground text-sm">
                  עצרו מיד בצל, שתו מים, וחכו שיהיה יותר טוב. אם לא משתפר - חירום!
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Bike className="w-5 h-5 text-accent" />
                  אופניים לא נוסעים
                </h3>
                <p className="text-muted-foreground text-sm">
                  נסו את הטיפים למעלה. עדיין לא? שלחו תמונה לוואטסאפ ונעזור!
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <a href="tel:+972501234567">
                <Button size="lg" variant="destructive" className="gap-2 animate-pulse">
                  📞 קו חירום: 050-123-4567
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Fun Quote Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-destructive/10 via-primary/5 to-background">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6 animate-bounce">🎉</div>
          <blockquote className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-relaxed">
            "החיים הם כמו רכיבה על אופניים -
            <br />
            <span className="text-primary">כדי לשמור על איזון צריך להמשיך לנוע!"</span>
          </blockquote>
          <p className="text-muted-foreground text-lg">— אלברט איינשטיין (שגם רכב במכתש... אולי)</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking">
              <Button size="lg" className="btn-hero gap-2">
                <ThumbsUp className="w-5 h-5" />
                מוכנים לצאת לדרך!
              </Button>
            </Link>
            <Link to="/guest">
              <Button size="lg" variant="outline" className="gap-2">
                <Home className="w-5 h-5" />
                {isRTL ? 'חזרה לאזור האישי' : 'Back to My Area'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RiderInfoPage;
