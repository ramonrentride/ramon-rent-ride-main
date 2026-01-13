import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Shield } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import heroImage from '@/assets/hero-crater.jpg';

const TermsLiabilityPage = () => {
  const { isRTL } = useI18n();

  const termsContent = `מדיניות ביטוח ואחריות – השכרת אופניים

1. אחריות הרוכב
השוכר מאשר כי הוא אחראי באופן מלא לשמירה על האופניים וציודם בזמן תקופת ההשכרה. כל נזק, אובדן או גניבה הנגרמים באשמתו יחויבו על חשבונו.

2. ביטוח כלול
כל השכרה כוללת ביטוח בסיסי המכסה נזקי צד שלישי עד 50,000 ש"ח ונזק עצמי חלקי (בהשתתפות עצמית של 500 ש"ח). הביטוח אינו מכסה: גניבה ללא שימוש במנעול, נהיגה ברשלנות, או נזק מכוון.

3. השתתפות עצמית
במקרה של תאונה או נזק, המשתמש יישא בהשתתפות עצמית בגובה 500 ש"ח. הסכום ייגבה מתוך הפיקדון.

4. גניבה
במקרה של גניבה האופניים יש להגיש תלונה במשטרה תוך 24 שעות ולהעביר אלינו את מספר התלונה. חיוב גניבה מלא: עד 2,500 ש"ח לאופניים.

5. פטור מאחריות
השוכר מאשר כי הוא רוכב על אחריותו ומוותר על תביעות כנגד החברה בגין פציעות אישיות. יש לשקול ביטוח בריאות פרטי.

6. חתימה
לחיצה על 'אני מאשר' מהווה הסכמה מלאה לתנאים אלה.`;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="min-h-screen bg-gradient-to-b from-background/95 via-background/90 to-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/">
              <Button variant="outline" className="gap-2 bg-white/10 border-white/20 hover:bg-white/20">
                <Home className="w-4 h-4" />
                🏠 {isRTL ? 'דף הבית' : 'Home'}
              </Button>
            </Link>

            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              {isRTL ? 'תנאים ואחריות' : 'Terms & Liability'}
            </h1>
          </div>

          {/* Content Card */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="w-5 h-5 text-primary" />
                {isRTL ? 'מדיניות ביטוח ואחריות' : 'Insurance & Liability Policy'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="space-y-4 text-muted-foreground whitespace-pre-line leading-relaxed"
                dir="rtl"
              >
                {termsContent}
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link to="/guest">
              <Button variant="outline" className="gap-2">
                {isRTL ? 'חזרה לאזור האישי' : 'Back to My Area'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsLiabilityPage;
