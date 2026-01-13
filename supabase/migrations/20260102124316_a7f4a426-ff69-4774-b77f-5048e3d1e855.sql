-- Seed existing content from the website into site_content table

-- Homepage Features (Why Choose Us)
INSERT INTO public.site_content (section, content_key, value_he, value_en, content_type, sort_order, is_active, metadata) VALUES
('homepage.features', 'feature.bikes', 'אופניים מקצועיים', 'Professional Bikes', 'feature', 1, true, '{"icon": "Bike", "descriptionHe": "אופני הרים איכותיים בגדלים שונים", "descriptionEn": "Quality mountain bikes in various sizes"}'),
('homepage.features', 'feature.trails', 'מסלולים מסומנים', 'Marked Trails', 'feature', 2, true, '{"icon": "Map", "descriptionHe": "מסלולים מסומנים ומותאמים לכל הרמות", "descriptionEn": "Marked trails suitable for all levels"}'),
('homepage.features', 'feature.picnic', 'פיקניק מדברי', 'Desert Picnic', 'feature', 3, true, '{"icon": "UtensilsCrossed", "descriptionHe": "הזמינו סלסלת פיקניק לחוויה מושלמת", "descriptionEn": "Order a picnic basket for the perfect experience"}');

-- Homepage Animals (Nature Section)
INSERT INTO public.site_content (section, content_key, value_he, value_en, content_type, sort_order, is_active, metadata) VALUES
('homepage.nature', 'animal.ibex', 'יעל נובי', 'Nubian Ibex', 'animal', 1, true, '{"image": "/src/assets/animal-ibex.jpg", "descriptionHe": "היעל הנובי הוא סמל המדבר הישראלי. ניתן לפגוש אותו בשעות הבוקר המוקדמות כשהוא מטפס על הצוקים.", "descriptionEn": "The Nubian Ibex is a symbol of the Israeli desert. You can meet it in the early morning hours climbing on the cliffs."}'),
('homepage.nature', 'animal.vulture', 'נשר', 'Griffon Vulture', 'animal', 2, true, '{"image": "/src/assets/animal-vulture.jpg", "descriptionHe": "הנשר הוא הציפור הגדולה ביותר בישראל. מוטת כנפיו מגיעה ל-2.8 מטר והוא מרחף מעל המכתשים.", "descriptionEn": "The Griffon Vulture is the largest bird in Israel. Its wingspan reaches 2.8 meters and it soars above the craters."}'),
('homepage.nature', 'animal.eagle', 'עיט ניצי', 'Short-toed Eagle', 'animal', 3, true, '{"image": "/src/assets/animal-eagle.jpg", "descriptionHe": "עיט הנחשים מתמחה בציד זוחלים. הוא נפוץ באזור ומרחף מעל השבילים בחיפוש אחר טרף.", "descriptionEn": "The Short-toed Eagle specializes in hunting reptiles. It is common in the area and hovers over trails searching for prey."}'),
('homepage.nature', 'animal.fox', 'שועל', 'Red Fox', 'animal', 4, true, '{"image": "/src/assets/animal-fox.jpg", "descriptionHe": "השועל המדברי מותאם לחיים בתנאי המדבר הקשים. ניתן לראותו בשעות הדמדומים.", "descriptionEn": "The desert fox is adapted to life in harsh desert conditions. It can be seen at twilight hours."}');

-- Rider Guide - Riding Tips
INSERT INTO public.site_content (section, content_key, value_he, value_en, content_type, sort_order, is_active, metadata) VALUES
('riderGuide.tips', 'tip.water', 'שתייה', 'Hydration', 'tip', 1, true, '{"icon": "Droplets", "descriptionHe": "שתו לפחות חצי ליטר מים לכל שעת רכיבה", "descriptionEn": "Drink at least half a liter of water per hour of riding"}'),
('riderGuide.tips', 'tip.sun', 'הגנה מהשמש', 'Sun Protection', 'tip', 2, true, '{"icon": "Sun", "descriptionHe": "הקפידו על כובע, משקפי שמש וקרם הגנה", "descriptionEn": "Make sure to wear a hat, sunglasses and sunscreen"}'),
('riderGuide.tips', 'tip.pace', 'קצב', 'Pace', 'tip', 3, true, '{"icon": "Gauge", "descriptionHe": "התחילו בקצב נוח והאיצו בהדרגה", "descriptionEn": "Start at a comfortable pace and gradually increase"}'),
('riderGuide.tips', 'tip.brakes', 'בלמים', 'Brakes', 'tip', 4, true, '{"icon": "CircleStop", "descriptionHe": "השתמשו בשני הבלמים יחד, בעדיפות לבלם האחורי", "descriptionEn": "Use both brakes together, with preference for the rear brake"}'),
('riderGuide.tips', 'tip.gears', 'הילוכים', 'Gears', 'tip', 5, true, '{"icon": "Settings", "descriptionHe": "החליפו הילוך לפני העלייה, לא באמצעה", "descriptionEn": "Change gears before the climb, not during it"}'),
('riderGuide.tips', 'tip.terrain', 'שטח', 'Terrain', 'tip', 6, true, '{"icon": "Mountain", "descriptionHe": "היו קשובים לשינויי השטח והתאימו את המהירות", "descriptionEn": "Be aware of terrain changes and adjust your speed"}');

-- Rider Guide - Common Issues
INSERT INTO public.site_content (section, content_key, value_he, value_en, content_type, sort_order, is_active, metadata) VALUES
('riderGuide.repairs', 'repair.flat', 'פנצ׳ר', 'Flat Tire', 'repair', 1, true, '{"icon": "CircleX", "solutionHe": "התקשרו אלינו ונגיע לעזור. אל תמשיכו לרכוב!", "solutionEn": "Call us and we will come to help. Do not continue riding!"}'),
('riderGuide.repairs', 'repair.chain', 'שרשרת', 'Chain Issues', 'repair', 2, true, '{"icon": "Link", "solutionHe": "אם השרשרת נפלה, נסו להחזיר אותה בעדינות", "solutionEn": "If the chain fell off, try to gently put it back"}'),
('riderGuide.repairs', 'repair.brakes', 'בלמים', 'Brake Problems', 'repair', 3, true, '{"icon": "AlertTriangle", "solutionHe": "אם הבלמים לא עובדים כמו שצריך - עצרו מיד!", "solutionEn": "If the brakes are not working properly - stop immediately!"}'),
('riderGuide.repairs', 'repair.gears', 'הילוכים', 'Gear Issues', 'repair', 4, true, '{"icon": "Settings", "solutionHe": "אם ההילוכים לא מחליפים בצורה חלקה, המשיכו בהילוך נוח", "solutionEn": "If gears are not shifting smoothly, continue in a comfortable gear"}'),
('riderGuide.repairs', 'repair.seat', 'מושב', 'Seat Adjustment', 'repair', 5, true, '{"icon": "ArrowUpDown", "solutionHe": "אם המושב זז, הדקו את הברגים בעזרת הכלי שקיבלתם", "solutionEn": "If the seat moves, tighten the screws with the tool you received"}'),
('riderGuide.repairs', 'repair.handlebars', 'כידון', 'Handlebar Issues', 'repair', 6, true, '{"icon": "Move", "solutionHe": "אם הכידון רופף, עצרו והדקו לפני המשך הרכיבה", "solutionEn": "If the handlebar is loose, stop and tighten before continuing"}');

-- Guest Area - Quick Links
INSERT INTO public.site_content (section, content_key, value_he, value_en, content_type, sort_order, is_active, metadata) VALUES
('guestArea', 'link.booking', 'הזמנה חדשה', 'New Booking', 'quickLink', 1, true, '{"icon": "Calendar", "href": "/booking", "descriptionHe": "הזמינו אופניים לרכיבה במכתש", "descriptionEn": "Book bikes for riding in the crater"}'),
('guestArea', 'link.myBookings', 'ההזמנות שלי', 'My Bookings', 'quickLink', 2, true, '{"icon": "ClipboardList", "href": "/guest", "descriptionHe": "צפייה וניהול ההזמנות שלכם", "descriptionEn": "View and manage your bookings"}'),
('guestArea', 'link.trails', 'מסלולים', 'Trails', 'quickLink', 3, true, '{"icon": "Map", "href": "/rider-info", "descriptionHe": "מידע על המסלולים והמלצות", "descriptionEn": "Trail information and recommendations"}'),
('guestArea', 'link.contact', 'צור קשר', 'Contact Us', 'quickLink', 4, true, '{"icon": "Phone", "href": "tel:+972528943322", "descriptionHe": "דברו איתנו", "descriptionEn": "Talk to us"}');