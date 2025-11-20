// Base de dados completa de marcas e modelos de veículos
// Inclui as principais marcas do mercado português

export interface VehicleBrand {
  name: string
  models: string[]
  logo?: string
}

export interface VehicleMotorization {
  brand: string
  model: string
  motorizations: string[]
}

export const VEHICLE_DATABASE: VehicleBrand[] = [
  {
    name: 'ABARTH',
    models: ['124 Spider', '500', '595', '695']
  },
  {
    name: 'ALFA ROMEO',
    models: ['Giulia', 'Giulietta', 'Stelvio', 'Tonale', '159', '156', '147', 'GT', 'MiTo', 'Spider']
  },
  {
    name: 'ASTON MARTIN',
    models: ['DB11', 'DBS', 'DBX', 'Vantage', 'Rapide']
  },
  {
    name: 'AUDI',
    models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron', 'e-tron GT']
  },
  {
    name: 'BENTLEY',
    models: ['Bentayga', 'Continental', 'Flying Spur']
  },
  {
    name: 'BMW',
    models: ['Série 1', 'Série 2', 'Série 3', 'Série 4', 'Série 5', 'Série 6', 'Série 7', 'Série 8', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX', 'iX3']
  },
  {
    name: 'BUGATTI',
    models: ['Chiron', 'Veyron']
  },
  {
    name: 'CADILLAC',
    models: ['CT4', 'CT5', 'Escalade', 'XT4', 'XT5', 'XT6']
  },
  {
    name: 'CHEVROLET',
    models: ['Aveo', 'Camaro', 'Captiva', 'Corvette', 'Cruze', 'Epica', 'Kalos', 'Lacetti', 'Matiz', 'Orlando', 'Spark', 'Trax']
  },
  {
    name: 'CHRYSLER',
    models: ['300C', 'Grand Voyager', 'PT Cruiser', 'Sebring', 'Voyager']
  },
  {
    name: 'CITROËN',
    models: ['C1', 'C3', 'C3 Aircross', 'C4', 'C4 Cactus', 'C4 Picasso', 'C5', 'C5 Aircross', 'Berlingo', 'Jumpy', 'SpaceTourer', 'Ami', 'ë-C4']
  },
  {
    name: 'CUPRA',
    models: ['Ateca', 'Born', 'Formentor', 'Leon']
  },
  {
    name: 'DACIA',
    models: ['Dokker', 'Duster', 'Jogger', 'Lodgy', 'Logan', 'Sandero', 'Spring']
  },
  {
    name: 'DODGE',
    models: ['Caliber', 'Challenger', 'Charger', 'Durango', 'Journey', 'Nitro', 'RAM']
  },
  {
    name: 'DS',
    models: ['DS 3', 'DS 4', 'DS 7', 'DS 9']
  },
  {
    name: 'FERRARI',
    models: ['296', '488', '812', 'F8', 'Portofino', 'Roma', 'SF90']
  },
  {
    name: 'FIAT',
    models: ['500', '500C', '500L', '500X', 'Bravo', 'Doblo', 'Ducato', 'Fiorino', 'Panda', 'Punto', 'Qubo', 'Scudo', 'Tipo', 'Ulysse']
  },
  {
    name: 'FORD',
    models: ['B-MAX', 'C-MAX', 'EcoSport', 'Edge', 'Fiesta', 'Focus', 'Fusion', 'Galaxy', 'Grand C-MAX', 'Ka', 'Kuga', 'Mondeo', 'Mustang', 'Puma', 'Ranger', 'S-MAX', 'Tourneo', 'Transit']
  },
  {
    name: 'HONDA',
    models: ['Accord', 'Civic', 'CR-V', 'CR-Z', 'e', 'FR-V', 'HR-V', 'Insight', 'Jazz', 'Legend', 'Odyssey', 'Stream']
  },
  {
    name: 'HYUNDAI',
    models: ['Accent', 'Atos', 'Bayon', 'Coupe', 'Elantra', 'Galloper', 'Getz', 'i10', 'i20', 'i30', 'i40', 'IONIQ', 'IONIQ 5', 'IONIQ 6', 'ix20', 'ix35', 'KONA', 'Matrix', 'Nexo', 'Santa Fe', 'Sonata', 'Terracan', 'Trajet', 'Tucson', 'Veloster']
  },
  {
    name: 'INFINITI',
    models: ['Q30', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX70']
  },
  {
    name: 'JAGUAR',
    models: ['E-PACE', 'F-PACE', 'F-TYPE', 'I-PACE', 'S-Type', 'X-Type', 'XE', 'XF', 'XJ', 'XK']
  },
  {
    name: 'JEEP',
    models: ['Avenger', 'Cherokee', 'Commander', 'Compass', 'Gladiator', 'Grand Cherokee', 'Patriot', 'Renegade', 'Wrangler']
  },
  {
    name: 'KIA',
    models: ['Carens', 'Carnival', 'Ceed', 'Cerato', 'EV6', 'EV9', 'Magentis', 'Niro', 'Opirus', 'Optima', 'Picanto', 'ProCeed', 'Rio', 'Sorento', 'Soul', 'Sportage', 'Stinger', 'Stonic', 'Venga', 'XCeed']
  },
  {
    name: 'LAMBORGHINI',
    models: ['Aventador', 'Huracán', 'Urus']
  },
  {
    name: 'LANCIA',
    models: ['Delta', 'Musa', 'Phedra', 'Thesis', 'Ypsilon']
  },
  {
    name: 'LAND ROVER',
    models: ['Defender', 'Discovery', 'Discovery Sport', 'Evoque', 'Freelander', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar']
  },
  {
    name: 'LEXUS',
    models: ['CT', 'ES', 'GS', 'IS', 'LC', 'LS', 'NX', 'RC', 'RX', 'UX']
  },
  {
    name: 'LOTUS',
    models: ['Elise', 'Emira', 'Evora', 'Exige']
  },
  {
    name: 'MASERATI',
    models: ['Ghibli', 'GranCabrio', 'GranTurismo', 'Grecale', 'Levante', 'MC20', 'Quattroporte']
  },
  {
    name: 'MAZDA',
    models: ['2', '3', '5', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'MX-30', 'MX-5', 'Premacy', 'RX-8']
  },
  {
    name: 'MCLAREN',
    models: ['570S', '600LT', '720S', 'Artura', 'GT']
  },
  {
    name: 'MERCEDES-BENZ',
    models: ['Classe A', 'Classe B', 'Classe C', 'Classe CLA', 'Classe CLS', 'Classe E', 'Classe G', 'Classe GLA', 'Classe GLB', 'Classe GLC', 'Classe GLE', 'Classe GLS', 'Classe S', 'Classe V', 'Citan', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'SL', 'SLC', 'Sprinter', 'Vito']
  },
  {
    name: 'MG',
    models: ['3', '4', '5', 'HS', 'Marvel R', 'MG ZS', 'ZS EV']
  },
  {
    name: 'MINI',
    models: ['Clubman', 'Countryman', 'Cooper', 'Paceman']
  },
  {
    name: 'MITSUBISHI',
    models: ['ASX', 'Colt', 'Eclipse Cross', 'Grandis', 'i-MiEV', 'L200', 'Lancer', 'Outlander', 'Pajero', 'Space Star']
  },
  {
    name: 'NISSAN',
    models: ['370Z', 'Almera', 'Ariya', 'Cube', 'e-NV200', 'GT-R', 'Juke', 'Leaf', 'Micra', 'Murano', 'Navara', 'Note', 'NV200', 'NV300', 'NV400', 'Pathfinder', 'Pixo', 'Primastar', 'Pulsar', 'Qashqai', 'Townstar', 'X-Trail']
  },
  {
    name: 'OPEL',
    models: ['Adam', 'Agila', 'Ampera', 'Antara', 'Astra', 'Cascada', 'Combo', 'Corsa', 'Crossland', 'Frontera', 'Grandland', 'Insignia', 'Karl', 'Meriva', 'Mokka', 'Monterey', 'Movano', 'Omega', 'Signum', 'Tigra', 'Vectra', 'Vivaro', 'Zafira']
  },
  {
    name: 'PEUGEOT',
    models: ['106', '107', '108', '206', '207', '208', '2008', '301', '306', '307', '308', '3008', '406', '407', '408', '5008', '508', '607', '807', 'Bipper', 'Boxer', 'Expert', 'iOn', 'Partner', 'Rifter', 'Traveller', 'e-208', 'e-2008']
  },
  {
    name: 'POLESTAR',
    models: ['2', '3']
  },
  {
    name: 'PORSCHE',
    models: ['718', '911', 'Cayenne', 'Cayman', 'Macan', 'Panamera', 'Taycan']
  },
  {
    name: 'RENAULT',
    models: ['Arkana', 'Austral', 'Captur', 'Clio', 'Espace', 'Express', 'Fluence', 'Grand Scenic', 'Kadjar', 'Kangoo', 'Koleos', 'Laguna', 'Master', 'Megane', 'Modus', 'Scenic', 'Talisman', 'Trafic', 'Twingo', 'Twizy', 'Vel Satis', 'Wind', 'Zoe']
  },
  {
    name: 'ROLLS-ROYCE',
    models: ['Cullinan', 'Ghost', 'Phantom', 'Wraith']
  },
  {
    name: 'ROVER',
    models: ['25', '45', '75', 'Streetwise']
  },
  {
    name: 'SAAB',
    models: ['9-3', '9-5']
  },
  {
    name: 'SEAT',
    models: ['Alhambra', 'Altea', 'Arona', 'Ateca', 'Cordoba', 'Exeo', 'Ibiza', 'Leon', 'Mii', 'Tarraco', 'Toledo']
  },
  {
    name: 'SKODA',
    models: ['Citigo', 'Enyaq', 'Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Rapid', 'Roomster', 'Scala', 'Superb', 'Yeti']
  },
  {
    name: 'SMART',
    models: ['Forfour', 'Fortwo']
  },
  {
    name: 'SSANGYONG',
    models: ['Actyon', 'Korando', 'Kyron', 'Rexton', 'Rodius', 'Tivoli']
  },
  {
    name: 'SUBARU',
    models: ['BRZ', 'Forester', 'Impreza', 'Legacy', 'Levorg', 'Outback', 'Solterra', 'Tribeca', 'WRX', 'XV']
  },
  {
    name: 'SUZUKI',
    models: ['Across', 'Alto', 'Baleno', 'Celerio', 'Grand Vitara', 'Ignis', 'Jimny', 'Liana', 'S-Cross', 'Splash', 'Swift', 'SX4', 'Vitara', 'Wagon R']
  },
  {
    name: 'TESLA',
    models: ['Model 3', 'Model S', 'Model X', 'Model Y']
  },
  {
    name: 'TOYOTA',
    models: ['4Runner', 'Auris', 'Avensis', 'Aygo', 'bZ4X', 'C-HR', 'Camry', 'Corolla', 'Corolla Cross', 'Corolla Verso', 'GT86', 'Highlander', 'Hilux', 'Land Cruiser', 'Mirai', 'Previa', 'Prius', 'ProAce', 'RAV4', 'Supra', 'Urban Cruiser', 'Verso', 'Yaris', 'Yaris Cross']
  },
  {
    name: 'VOLKSWAGEN',
    models: ['Amarok', 'Arteon', 'Beetle', 'Bora', 'Caddy', 'California', 'Caravelle', 'CC', 'Crafter', 'Eos', 'Fox', 'Golf', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID.Buzz', 'Jetta', 'Lupo', 'Multivan', 'New Beetle', 'Passat', 'Phaeton', 'Polo', 'Scirocco', 'Sharan', 'T-Cross', 'T-Roc', 'Taigo', 'Tiguan', 'Touareg', 'Touran', 'Transporter', 'Up']
  },
  {
    name: 'VOLVO',
    models: ['C30', 'C40', 'C70', 'S40', 'S60', 'S80', 'S90', 'V40', 'V50', 'V60', 'V70', 'V90', 'XC40', 'XC60', 'XC70', 'XC90']
  }
]

// Base de dados de motorizações por marca e modelo
export const MOTORIZATIONS_DATABASE: VehicleMotorization[] = [
  // AUDI
  { brand: 'AUDI', model: 'A3', motorizations: ['1.0 TFSI 110CV', '1.5 TFSI 150CV', '2.0 TDI 150CV', '2.0 TFSI 190CV', '2.0 TFSI 310CV S3'] },
  { brand: 'AUDI', model: 'A4', motorizations: ['1.4 TFSI 150CV', '2.0 TDI 150CV', '2.0 TDI 190CV', '2.0 TFSI 190CV', '2.0 TFSI 252CV', '3.0 TDI 286CV'] },
  { brand: 'AUDI', model: 'Q3', motorizations: ['1.5 TFSI 150CV', '2.0 TDI 150CV', '2.0 TFSI 190CV', '2.0 TFSI 230CV'] },
  { brand: 'AUDI', model: 'Q5', motorizations: ['2.0 TDI 150CV', '2.0 TDI 204CV', '2.0 TFSI 252CV', '3.0 TDI 286CV'] },
  
  // BMW
  { brand: 'BMW', model: 'Série 1', motorizations: ['1.5i 136CV', '2.0i 178CV', '2.0i 306CV M135i', '1.5d 116CV', '2.0d 150CV', '2.0d 190CV'] },
  { brand: 'BMW', model: 'Série 3', motorizations: ['2.0i 184CV', '2.0i 258CV', '3.0i 374CV M340i', '2.0d 150CV', '2.0d 190CV', '3.0d 286CV'] },
  { brand: 'BMW', model: 'X1', motorizations: ['1.5i 140CV', '2.0i 192CV', '1.5d 116CV', '2.0d 150CV', '2.0d 190CV'] },
  { brand: 'BMW', model: 'X3', motorizations: ['2.0i 184CV', '3.0i 286CV', '2.0d 190CV', '3.0d 286CV', '3.0d 340CV M40d'] },
  
  // MERCEDES-BENZ
  { brand: 'MERCEDES-BENZ', model: 'Classe A', motorizations: ['1.3 160 122CV', '2.0 200 163CV', '2.0 250 224CV', '1.5 180d 116CV', '2.0 200d 150CV', '2.0 220d 190CV'] },
  { brand: 'MERCEDES-BENZ', model: 'Classe C', motorizations: ['1.5 180 170CV', '2.0 200 204CV', '2.0 300 258CV', '2.0 200d 163CV', '2.0 220d 194CV', '3.0 400d 330CV'] },
  { brand: 'MERCEDES-BENZ', model: 'Classe GLA', motorizations: ['1.3 200 163CV', '2.0 250 224CV', '2.0 180d 116CV', '2.0 200d 150CV', '2.0 220d 190CV'] },
  { brand: 'MERCEDES-BENZ', model: 'Classe GLC', motorizations: ['2.0 200 204CV', '2.0 300 258CV', '2.0 200d 163CV', '2.0 220d 194CV', '3.0 400d 330CV'] },
  
  // VOLKSWAGEN
  { brand: 'VOLKSWAGEN', model: 'Golf', motorizations: ['1.0 TSI 110CV', '1.5 TSI 130CV', '1.5 TSI 150CV', '2.0 TSI 245CV GTI', '2.0 TSI 320CV R', '2.0 TDI 115CV', '2.0 TDI 150CV'] },
  { brand: 'VOLKSWAGEN', model: 'Polo', motorizations: ['1.0 TSI 95CV', '1.0 TSI 110CV', '1.5 TSI 150CV', '2.0 TSI 207CV GTI', '1.6 TDI 95CV', '1.6 TDI 80CV'] },
  { brand: 'VOLKSWAGEN', model: 'Tiguan', motorizations: ['1.5 TSI 130CV', '1.5 TSI 150CV', '2.0 TSI 190CV', '2.0 TDI 150CV', '2.0 TDI 200CV'] },
  { brand: 'VOLKSWAGEN', model: 'T-Roc', motorizations: ['1.0 TSI 110CV', '1.5 TSI 150CV', '2.0 TSI 190CV', '2.0 TDI 150CV'] },
  
  // PEUGEOT
  { brand: 'PEUGEOT', model: '208', motorizations: ['1.2 PureTech 75CV', '1.2 PureTech 100CV', '1.2 PureTech 130CV', '1.5 BlueHDi 100CV', '1.5 BlueHDi 130CV', 'e-208 136CV'] },
  { brand: 'PEUGEOT', model: '308', motorizations: ['1.2 PureTech 110CV', '1.2 PureTech 130CV', '1.6 PureTech 180CV', '1.5 BlueHDi 130CV', '2.0 BlueHDi 180CV'] },
  { brand: 'PEUGEOT', model: '2008', motorizations: ['1.2 PureTech 100CV', '1.2 PureTech 130CV', '1.2 PureTech 155CV', '1.5 BlueHDi 110CV', '1.5 BlueHDi 130CV', 'e-2008 136CV'] },
  { brand: 'PEUGEOT', model: '3008', motorizations: ['1.2 PureTech 130CV', '1.6 PureTech 180CV', '1.5 BlueHDi 130CV', '2.0 BlueHDi 180CV'] },
  
  // RENAULT
  { brand: 'RENAULT', model: 'Clio', motorizations: ['1.0 TCe 90CV', '1.0 TCe 100CV', '1.3 TCe 130CV', '1.5 dCi 85CV', '1.5 dCi 115CV', 'E-Tech 140CV'] },
  { brand: 'RENAULT', model: 'Captur', motorizations: ['1.0 TCe 90CV', '1.3 TCe 130CV', '1.3 TCe 155CV', '1.5 dCi 95CV', '1.5 dCi 115CV', 'E-Tech 145CV'] },
  { brand: 'RENAULT', model: 'Megane', motorizations: ['1.3 TCe 140CV', '1.5 dCi 115CV', '1.7 Blue dCi 150CV', 'E-Tech 220CV'] },
  { brand: 'RENAULT', model: 'Zoe', motorizations: ['E-Tech 135CV', 'E-Tech 110CV'] },
  
  // FORD
  { brand: 'FORD', model: 'Fiesta', motorizations: ['1.0 EcoBoost 100CV', '1.0 EcoBoost 125CV', '1.5 TDCi 85CV', '1.5 TDCi 120CV', '1.5 EcoBoost 200CV ST'] },
  { brand: 'FORD', model: 'Focus', motorizations: ['1.0 EcoBoost 125CV', '1.5 EcoBoost 150CV', '1.5 EcoBoost 182CV', '1.5 TDCi 120CV', '2.0 TDCi 150CV', '2.3 EcoBoost 280CV ST'] },
  { brand: 'FORD', model: 'Puma', motorizations: ['1.0 EcoBoost 125CV', '1.0 EcoBoost 155CV', '1.5 EcoBoost 200CV ST'] },
  { brand: 'FORD', model: 'Kuga', motorizations: ['1.5 EcoBoost 150CV', '2.0 EcoBlue 150CV', '2.5 PHEV 225CV'] },
  
  // OPEL
  { brand: 'OPEL', model: 'Corsa', motorizations: ['1.2 75CV', '1.2 Turbo 100CV', '1.2 Turbo 130CV', '1.5 Diesel 100CV', 'Corsa-e 136CV'] },
  { brand: 'OPEL', model: 'Astra', motorizations: ['1.2 Turbo 110CV', '1.2 Turbo 130CV', '1.5 Diesel 122CV', '1.6 Diesel 136CV'] },
  { brand: 'OPEL', model: 'Mokka', motorizations: ['1.2 Turbo 100CV', '1.2 Turbo 130CV', '1.5 Diesel 110CV', 'Mokka-e 136CV'] },
  { brand: 'OPEL', model: 'Grandland', motorizations: ['1.2 Turbo 130CV', '1.5 Diesel 130CV', '1.6 PHEV 225CV', '1.6 PHEV 300CV'] },
  
  // NISSAN
  { brand: 'NISSAN', model: 'Juke', motorizations: ['1.0 DIG-T 114CV', '1.0 DIG-T 117CV', '1.5 dCi 110CV'] },
  { brand: 'NISSAN', model: 'Qashqai', motorizations: ['1.3 DIG-T 140CV', '1.3 DIG-T 158CV', '1.5 dCi 115CV', 'e-Power 190CV'] },
  { brand: 'NISSAN', model: 'X-Trail', motorizations: ['1.3 DIG-T 158CV', '1.7 dCi 150CV', 'e-Power 213CV'] },
  
  // TOYOTA
  { brand: 'TOYOTA', model: 'Yaris', motorizations: ['1.0 VVT-i 72CV', '1.5 VVT-i 111CV', '1.5 Hybrid 116CV'] },
  { brand: 'TOYOTA', model: 'Corolla', motorizations: ['1.8 Hybrid 122CV', '2.0 Hybrid 184CV'] },
  { brand: 'TOYOTA', model: 'C-HR', motorizations: ['1.8 Hybrid 122CV', '2.0 Hybrid 184CV'] },
  { brand: 'TOYOTA', model: 'RAV4', motorizations: ['2.0 Hybrid 197CV', '2.5 Hybrid 218CV', '2.5 PHEV 306CV'] },
  
  // JAGUAR
  { brand: 'JAGUAR', model: 'E-PACE', motorizations: ['2.0D 150CV', '2.0D 180CV', '2.0D 240CV', '2.0 200CV', '2.0 249CV', '2.0 300CV'] },
  { brand: 'JAGUAR', model: 'F-PACE', motorizations: ['2.0D 163CV', '2.0D 204CV', '3.0D 300CV', '2.0 250CV', '3.0 340CV', '5.0 V8 550CV'] },
  { brand: 'JAGUAR', model: 'I-PACE', motorizations: ['Electric 400CV'] },
  
  // DACIA
  { brand: 'DACIA', model: 'Sandero', motorizations: ['1.0 SCe 65CV', '1.0 TCe 90CV', '1.0 TCe 100CV'] },
  { brand: 'DACIA', model: 'Duster', motorizations: ['1.0 TCe 90CV', '1.3 TCe 130CV', '1.5 dCi 115CV', '1.5 Blue dCi 115CV'] },
  { brand: 'DACIA', model: 'Jogger', motorizations: ['1.0 TCe 110CV', '1.6 Hybrid 140CV'] },
  { brand: 'DACIA', model: 'Spring', motorizations: ['Electric 65CV'] },
  
  // TESLA
  { brand: 'TESLA', model: 'Model 3', motorizations: ['RWD 325CV', 'Long Range AWD 450CV', 'Performance 510CV'] },
  { brand: 'TESLA', model: 'Model Y', motorizations: ['RWD 299CV', 'Long Range AWD 378CV', 'Performance 534CV'] },
  { brand: 'TESLA', model: 'Model S', motorizations: ['Long Range 670CV', 'Plaid 1020CV'] },
  { brand: 'TESLA', model: 'Model X', motorizations: ['Long Range 670CV', 'Plaid 1020CV'] },
]

// Função para obter todos os nomes de marcas
export const getBrandNames = (): string[] => {
  return VEHICLE_DATABASE.map(brand => brand.name).sort()
}

// Função para obter modelos de uma marca específica
export const getModelsByBrand = (brandName: string): string[] => {
  const brand = VEHICLE_DATABASE.find(b => b.name === brandName)
  return brand ? brand.models.sort() : []
}

// Função para obter motorizações de um modelo específico
export const getMotorizationsByModel = (brandName: string, modelName: string): string[] => {
  const motorization = MOTORIZATIONS_DATABASE.find(
    m => m.brand === brandName && m.model === modelName
  )
  return motorization ? motorization.motorizations : []
}

// Função para obter URL de imagem do veículo (usando Unsplash com categorização inteligente)
export const getVehicleImageUrl = (brand: string, model: string): string => {
  const brandUpper = brand.toUpperCase()
  const modelUpper = model.toUpperCase()
  
  // Categorização por marca premium
  const premiumBrands = ['FERRARI', 'LAMBORGHINI', 'PORSCHE', 'ASTON MARTIN', 'BENTLEY', 'ROLLS-ROYCE', 'MASERATI', 'MCLAREN', 'BUGATTI']
  if (premiumBrands.includes(brandUpper)) {
    return 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&auto=format&fit=crop&q=80'
  }
  
  // Categorização por marca de luxo
  const luxuryBrands = ['MERCEDES-BENZ', 'BMW', 'AUDI', 'LEXUS', 'JAGUAR', 'CADILLAC', 'INFINITI', 'ALFA ROMEO']
  if (luxuryBrands.includes(brandUpper)) {
    return 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80'
  }
  
  // SUVs e Crossovers
  const suvModels = ['X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 
                     'TUCSON', 'SANTA FE', 'KONA', 'SPORTAGE', 'SORENTO', 'TIGUAN', 'TOUAREG', 'T-ROC', 'T-CROSS',
                     'QASHQAI', 'X-TRAIL', 'JUKE', 'CR-V', 'HR-V', 'RAV4', 'C-HR', 'LAND CRUISER',
                     'DEFENDER', 'DISCOVERY', 'EVOQUE', 'VELAR', 'RANGE ROVER', 'GRAND CHEROKEE', 'WRANGLER', 'COMPASS',
                     'CAPTUR', 'KADJAR', 'KOLEOS', 'MOKKA', 'GRANDLAND', 'CROSSLAND', 'ATECA', 'ARONA', 'TARRACO',
                     'KODIAQ', 'KAROQ', 'KAMIQ', 'PUMA', 'KUGA', 'EDGE', 'OUTLANDER', 'ASX', 'ECLIPSE CROSS',
                     'VITARA', 'S-CROSS', 'JIMNY', 'FORESTER', 'OUTBACK', 'XV', 'LEVORG', 'CAYENNE', 'MACAN',
                     'STELVIO', 'TONALE', 'DBX', 'URUS', 'LEVANTE', 'GRECALE', 'CULLINAN', 'BENTAYGA']
  
  const isSUV = suvModels.some(suv => modelUpper.includes(suv)) || 
                modelUpper.includes('SUV') || 
                modelUpper.includes('CROSSOVER') ||
                ['JEEP', 'LAND ROVER'].includes(brandUpper)
                
  if (isSUV) {
    return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80'
  }
  
  // Carros elétricos
  const evModels = ['MODEL 3', 'MODEL S', 'MODEL X', 'MODEL Y', 'LEAF', 'ARIYA', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID.BUZZ',
                    'E-TRON', 'EQ', 'I3', 'I4', 'IX', 'IONIQ', 'EV6', 'EV9', 'ZOE', 'TWINGO E-TECH', 'MEGANE E-TECH',
                    'E-208', 'E-2008', 'ENYAQ', 'BORN', 'MX-30', 'BZ4X', 'SOLTERRA', 'ARIYA', 'TAYCAN', 'POLESTAR']
  
  const isEV = evModels.some(ev => modelUpper.includes(ev)) || brandUpper === 'TESLA' || brandUpper === 'POLESTAR'
  
  if (isEV) {
    return 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80'
  }
  
  // Carros desportivos / Coupé
  const sportModels = ['911', 'CAYMAN', '718', 'CORVETTE', 'MUSTANG', 'CAMARO', 'GT86', 'BRZ', 'MX-5', 'Z4', 'SL', 'SLC',
                       'TT', 'R8', 'AMG GT', 'F-TYPE', 'LC', 'RC', 'GT-R', '370Z', 'SUPRA', 'NSX', 'CIVIC TYPE R']
  
  const isSport = sportModels.some(sport => modelUpper.includes(sport)) || 
                  modelUpper.includes('GT') || 
                  modelUpper.includes('SPORT') ||
                  modelUpper.includes('COUPE') ||
                  modelUpper.includes('ROADSTER')
  
  if (isSport) {
    return 'https://images.unsplash.com/photo-1614162692292-7ac56d7f1158?w=800&auto=format&fit=crop&q=80'
  }
  
  // Comerciais ligeiros / Vans
  const commercialBrands = ['TRANSIT', 'TRANSPORTER', 'DUCATO', 'MASTER', 'BOXER', 'JUMPER', 'SPRINTER', 'VITO', 'CRAFTER',
                            'EXPERT', 'VIVARO', 'TRAFIC', 'PROACE', 'KANGOO', 'BERLINGO', 'PARTNER', 'COMBO', 'CADDY']
  
  const isCommercial = commercialBrands.some(comm => modelUpper.includes(comm)) ||
                       modelUpper.includes('VAN') ||
                       modelUpper.includes('COMMERCIAL')
  
  if (isCommercial) {
    return 'https://images.unsplash.com/photo-1562519087-59a3bb7ed0e2?w=800&auto=format&fit=crop&q=80'
  }
  
  // Citadinos / compactos
  const cityModels = ['500', 'PANDA', 'UP', 'AYGO', 'C1', '108', 'PICANTO', 'RIO', 'I10', 'I20', 'FIESTA', 'KA', 
                      'POLO', 'IBIZA', 'CORSA', 'ADAM', 'TWINGO', 'CLIO', 'MICRA', 'JAZZ', 'SWIFT', 'IGNIS', 'YARIS']
  
  const isCity = cityModels.some(city => modelUpper.includes(city)) ||
                 modelUpper.includes('MINI') ||
                 brandUpper === 'SMART' ||
                 brandUpper === 'MINI'
  
  if (isCity) {
    return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80'
  }
  
  // Familiares / Station Wagon
  const familyModels = ['OCTAVIA COMBI', 'PASSAT VARIANT', 'MONDEO ESTATE', 'V60', 'V90', 'SUPERB COMBI', 
                        'LEON ST', 'FOCUS ESTATE', 'AVENSIS TOURING', 'INSIGNIA SPORTS TOURER']
  
  const isFamily = familyModels.some(fam => modelUpper.includes(fam)) ||
                   modelUpper.includes('COMBI') ||
                   modelUpper.includes('ESTATE') ||
                   modelUpper.includes('TOURING') ||
                   modelUpper.includes('VARIANT') ||
                   modelUpper.includes('BREAK')
  
  if (isFamily) {
    return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80'
  }
  
  // Marcas económicas / populares
  const economicBrands = ['DACIA', 'SKODA', 'SEAT', 'KIA', 'HYUNDAI', 'SUZUKI', 'MITSUBISHI', 'SSANGYONG']
  if (economicBrands.includes(brandUpper)) {
    return 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&auto=format&fit=crop&q=80'
  }
  
  // Sedans / Berlinas (default)
  return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80'
}

// Função para validar se uma marca existe
export const isValidBrand = (brandName: string): boolean => {
  return VEHICLE_DATABASE.some(brand => brand.name === brandName)
}

// Função para validar se um modelo existe para uma marca
export const isValidModel = (brandName: string, modelName: string): boolean => {
  const brand = VEHICLE_DATABASE.find(b => b.name === brandName)
  return brand ? brand.models.includes(modelName) : false
}
