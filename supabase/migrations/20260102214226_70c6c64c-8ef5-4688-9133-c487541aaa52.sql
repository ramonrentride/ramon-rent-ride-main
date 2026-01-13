-- Add disabled message columns to session_settings
ALTER TABLE session_settings 
ADD COLUMN IF NOT EXISTS disabled_message_he TEXT DEFAULT 'הסשן אינו זמין כרגע',
ADD COLUMN IF NOT EXISTS disabled_message_en TEXT DEFAULT 'Session not available';

-- Insert legal terms content
INSERT INTO site_content (section, content_key, value_he, value_en, content_type, sort_order, is_active, metadata)
VALUES 
  ('legal.terms', 'main', 'מדיניות ביטוח ואחריות', 'Insurance & Liability Policy', 'legalDocument', 1, true, 
   '{"contentHe": "השוכר מאשר כי קרא והבין את כל תנאי ההשכרה ומסכים להם במלואם. השוכר מתחייב לרכב בזהירות ובהתאם לחוקי התנועה.", "contentEn": "The renter confirms having read and understood all rental terms and agrees to them in full. The renter commits to riding carefully and in accordance with traffic laws."}'::jsonb)
ON CONFLICT (section, content_key) DO NOTHING;

-- Insert insurance policy sections
INSERT INTO site_content (section, content_key, value_he, value_en, content_type, sort_order, is_active, metadata)
VALUES 
  ('legal.insurance', 'section.responsibility', 'אחריות הרוכב', 'Rider Responsibility', 'legalSection', 1, true, 
   '{"contentHe": "השוכר מאשר כי הוא אחראי באופן מלא לשמירה על האופניים וציודם בזמן תקופת ההשכרה. כל נזק, אובדן או גניבה הנגרמים באשמתו יחויבו על חשבונו.", "contentEn": "The renter confirms full responsibility for the bikes and equipment during the rental period. Any damage, loss, or theft caused by negligence will be charged to the renter."}'::jsonb),
  
  ('legal.insurance', 'section.insurance', 'ביטוח כלול', 'Included Insurance', 'legalSection', 2, true,
   '{"contentHe": "כל השכרה כוללת ביטוח בסיסי המכסה נזקי צד שלישי עד 50,000 ש\"ח ונזק עצמי חלקי.", "contentEn": "Each rental includes basic insurance covering third-party damage up to 50,000₪ and partial self-damage.", "exclusionsHe": ["גניבה ללא שימוש במנעול", "נהיגה ברשלנות", "נזק מכוון"], "exclusionsEn": ["Theft without using the lock", "Negligent riding", "Intentional damage"]}'::jsonb),
  
  ('legal.insurance', 'section.deductible', 'השתתפות עצמית', 'Deductible', 'legalSection', 3, true,
   '{"contentHe": "במקרה של תאונה או נזק, המשתמש יישא בהשתתפות עצמית. הסכום ייגבה מתוך הפיקדון.", "contentEn": "In case of accident or damage, the user bears a deductible. This amount will be deducted from the deposit.", "amount": 500}'::jsonb),
  
  ('legal.insurance', 'section.theft', 'גניבה', 'Theft', 'legalSection', 4, true,
   '{"contentHe": "במקרה של גניבה יש להגיש תלונה במשטרה תוך 24 שעות ולהעביר אלינו את מספר התלונה. במקרה של גניבה ללא שימוש במנעול, יחויב השוכר במלוא עלות האופניים.", "contentEn": "In case of theft, file a police report within 24 hours and provide us with the report number. If theft occurs without using the lock, the renter will be charged the full bike cost.", "chargeAmount": 2500}'::jsonb),
  
  ('legal.insurance', 'section.waiver', 'פטור מאחריות', 'Liability Waiver', 'legalSection', 5, true,
   '{"contentHe": "השוכר מאשר כי הוא רוכב על אחריותו האישית ומוותר על כל תביעה כנגד החברה בגין פציעות אישיות, נזקים גופניים או כל נזק אחר העלול להיגרם במהלך הרכיבה.", "contentEn": "The renter confirms riding at their own personal risk and waives all claims against the company for personal injuries, bodily harm, or any other damage that may occur during riding."}'::jsonb),
  
  ('legal.insurance', 'section.agreement', 'הסכמה', 'Agreement', 'legalSection', 6, true,
   '{"contentHe": "לחיצה על \"אני מאשר\" מהווה הסכמה מלאה ומחייבת לכל התנאים המפורטים לעיל.", "contentEn": "Clicking \"I Accept\" constitutes full and binding agreement to all terms detailed above."}'::jsonb)
ON CONFLICT (section, content_key) DO NOTHING;