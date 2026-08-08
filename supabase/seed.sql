-- Catalog seed. Mirrors src/data/seed.ts (keep the two in sync).

insert into public.operators (id, name, since) values
  ('himalayan-nomads','Himalayan Nomads',2016),
  ('trek-tribe','Trek Tribe',2018),
  ('voyage-valley','Voyage Valley',2017),
  ('zostel-travel','Zostel Travel',2014),
  ('northeast-collective','Northeast Collective',2019),
  ('coast-co','Coast & Co',2020),
  ('marwar-trails','Marwar Trails',2015);

insert into public.trips (id,name,place,region,price,days,type,women_pct,rating,stay,difficulty,month,group_size,waitlist,operators,operator_id,lead_name,lead,lead_years,cities) values
  ('spiti','Spiti Valley Circuit','Himachal','himachal',15200,6,'Mountains',58,4.6,'Homestays','Moderate','Sep',12,12,4,'himalayan-nomads','Tashi','women',6,'Delhi, Manali'),
  ('kheer','Kheerganga & Kasol','Himachal','himachal',6400,3,'Treks',38,4.2,'Camps','Easy','Sep',18,8,3,'trek-tribe','Vikram','men',4,'Delhi'),
  ('hampta','Hampta Pass Trek','Himachal','himachal',11900,5,'Treks',50,4.4,'Camps','Moderate','Sep',9,5,2,'voyage-valley','Priya','women',5,'Manali'),
  ('ladakh','Leh & Nubra Loop','Ladakh','ladakh',24500,8,'Road trips',44,4.7,'Hotels','Moderate','Oct',14,17,5,'zostel-travel','Stanzin','men',9,'Leh, Delhi'),
  ('meghalaya','Living Root Bridges','Northeast','northeast',18900,6,'Treks',66,4.8,'Homestays','Hard','Oct',8,9,3,'northeast-collective','Ibanri','women',7,'Guwahati'),
  ('gokarna','Gokarna Beach Week','Karnataka','karnataka',8900,4,'Beaches',52,4.1,'Hostels','Easy','Nov',16,6,2,'coast-co','Rohan','men',3,'Bengaluru'),
  ('jaisalmer','Thar Desert Nights','Rajasthan','rajasthan',9600,3,'Deserts',41,4.0,'Camps','Easy','Nov',20,4,3,'marwar-trails','Karan','men',8,'Jaipur'),
  ('valley','Valley of Flowers','Uttarakhand','uttarakhand',13400,6,'Treks',71,4.5,'Homestays','Moderate','Sep',11,14,4,'himalayan-nomads','Meenakshi','women',6,'Rishikesh');

-- Traveller plans start empty — these are real, user-created via the app once
-- auth is live (host_id references a real profile). Demo plans intentionally removed.

insert into public.reviews (id,operator_id,name,stars,when_label,text) values
  ('r1','himalayan-nomads','Ritu',5,'Jun 2026','Trip lead checked in on every one of us at each stop. Rooms were exactly what the listing said.'),
  ('r2','himalayan-nomads','Dev',4,'May 2026','Good trip. Started two hours late on day one and nobody explained why, but the rest was smooth.'),
  ('r3','himalayan-nomads','Nikita',5,'Apr 2026','First time travelling alone. Never once felt like the odd one out — they seat solo travellers together on purpose.'),
  ('r4','himalayan-nomads','Arjun',3,'Mar 2026','Food was repetitive and the permit cost was a surprise at the checkpoint. Driving and stays were fine.');

insert into public.explore_regions (key,base,sub,per_day,know) values
  ('himachal','Around Kaza','3,800 m · phone signal only on BSNL',900,array['Carry cash — no ATMs past Kaza.','Altitude is real; give day one to nothing.','BSNL only, and barely.']),
  ('ladakh','Around Leh','3,500 m · acclimatise before you climb',1200,array['Inner Line Permits for Nubra/Pangong.','Rest day one — AMS is common.']),
  ('northeast','Around Cherrapunji','Wettest place on earth — carry a poncho',800,array['Bridges need a guide from Nongriat.','Leeches after rain — carry salt.']),
  ('karnataka','Around Gokarna','Beach town, temple town',700,array['Beach trek best at low tide.','Temple town is conservative — cover up.']),
  ('rajasthan','Around Jaisalmer','Golden city, Thar edge',900,array['Dunes are 40 km out at Sam.','Nights get cold — carry a layer.']),
  ('uttarakhand','Around Ghangaria','3,000 m · base for the Valley',600,array['No stay inside the valley — day hike only.','Hemkund is a steep 6 km more.']),
  ('kerala','Around Varkala','Cliff and sea, slow days',850,array['Monsoon shuts the cliff cafés.','Papanasam beach for the quiet end.']);

insert into public.itineraries (trip_id,idx,line) values
  ('spiti',1,'Manali → Kaza via Kunzum La'),('spiti',2,'Key Monastery, Kibber, Chicham'),('spiti',3,'Pin Valley & Dhankar hike'),('spiti',4,'Langza, Komic, Hikkim'),('spiti',5,'Chandratal Lake camp'),('spiti',6,'Return to Manali');
