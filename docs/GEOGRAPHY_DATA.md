# The Gambia Geographic Dataset Documentation

CivicTrack Gambia features an open, verified geographic dataset covering Local Government Areas (LGAs), towns, villages, communities, neighborhoods, streets, and public landmarks across The Gambia.

---

## 1. Local Government Areas (LGAs)

The platform models all **eight Local Government Areas (LGAs)** established under the Local Government Act of The Gambia. The field is clearly presented to citizens as **Region / Local Government Area**:

| LGA Identifier | Council Name | Council Type | Official Administrative Region |
|---|---|---|---|
| `banjul` (`BCC`) | **Banjul City Council** | City Council | Greater Banjul Area |
| `kanifing` (`KMC`) | **Kanifing Municipal Council** | Municipal Council | Greater Banjul Area |
| `brikama` (`BAC`) | **Brikama Area Council** | Area Council | West Coast Region |
| `mansakonko` (`MKAC`) | **Mansakonko Area Council** | Area Council | Lower River Region |
| `kerewan` (`KAC`) | **Kerewan Area Council** | Area Council | North Bank Region |
| `kuntaur` (`KUNTAUR`) | **Kuntaur Area Council** | Area Council | Central River Region (North) |
| `janjanbureh` (`JAC`) | **Janjanbureh Area Council** | Area Council | Central River Region (South) |
| `basse` (`BSAC`) | **Basse Area Council** | Area Council | Upper River Region |

### Preserving Official Geographic Distinctions
The data model preserves the official distinctions:
- **Banjul** is a **City Council** and **Kanifing** is a **Municipal Council**, both within the **Greater Banjul Area**.
- The remaining six are **Area Councils** representing regional administrative divisions (West Coast Region, Lower River Region, North Bank Region, Central River Region North & South, and Upper River Region).
- The system distinguishes between the council entity (`councilType`), administrative region (`administrativeRegion`), and LGA council name (`name`).

---

## 2. Communities, Streets and Landmarks Dataset

The compiled dataset (`apps/api/src/data/gambia-locations.json`) contains **2,387 verified locations** grouped and filterable by LGA:

- **Banjul City Council**: 67 verified entries (city wards, quarters, streets like Independence Drive, Marina Parade, Liberation Avenue, and landmarks like Albert Market, Arch 22, King Fahad Mosque, EFSTH Hospital, Ferry Terminal).
- **Kanifing Municipal Council**: 203 verified entries (Serekunda, Bakau, Fajara, Kotu, Kololi, Bundung, Tallinding, Latrikunda, Manjai, Dippa Kunda, Bakoteh, Kairaba Avenue, Sayerr Jobe Avenue, Bertil Harding Highway, Westfield Junction, Serekunda Market).
- **Brikama Area Council**: 489 verified entries (Brikama, Sukuta, Brufut, Tanji, Gunjur, Sanyang, Tujereng, Kartong, Lamin, Busumbala, Yundum, Bwiam, Kalagi, Sibanor, Somita, Mandinaba, Faraba Banta, etc.).
- **Mansakonko Area Council**: 176 verified entries (Mansakonko, Soma, Pakalinding, Jenoi, Kwinella, Kaiaf, Bureng, Toniataba, Sankwia, Dumbutu, Batelling, etc.).
- **Kerewan Area Council**: 393 verified entries (Kerewan, Barra, Essau, Farafenni, Albreda, Juffureh, Medina Sabakh, Ndugu Kebbeh, Ndofan, Suwareh Kunda, Salikene, No Kunda, etc.).
- **Kuntaur Area Council**: 381 verified entries (Kuntaur, Wassu, Kaur, Panchang, Karantaba, Sukuta Niani, Pallol, Chamen, Brikama Niani, Jamweli, etc.).
- **Janjanbureh Area Council**: 301 verified entries (Janjanbureh/Georgetown, Bansang, Brikama Ba, Kudang, Sambang, Dankunku, Choya, Kerewan Samba Sira, Bansang Hospital, Janjanbureh Ferry, etc.).
- **Basse Area Council**: 377 verified entries (Basse Santa Su, Fatoto, Garowol, Gambissara, Koina, Sabi, Demba Kunda, Numuyel, Sutukoba, Taifa, Chamoi, Diabugu, etc.).

---

## 3. Data Sources & Open Licenses

The geographic dataset is built strictly from open, reputable geographic repositories:

### 1. GeoNames Gazetteer (`GM.txt`)
- **Coverage**: Populated places (cities, towns, villages, communities, neighborhoods) and major geographic landmarks across all administrative divisions.
- **Provider**: [GeoNames](https://www.geonames.org)
- **License**: [Creative Commons Attribution 4.0 License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- **Attribution**: GeoNames gazetteer data for The Gambia (ISO 3166-1 `GM`), licensed under CC BY 4.0.

### 2. OpenStreetMap (OSM)
- **Coverage**: Named highways, avenues, streets, roads, marketplaces, clinics, hospitals, schools, police stations, ferry terminals, and cultural points of interest.
- **Provider**: [OpenStreetMap Foundation & Contributors](https://www.openstreetmap.org)
- **License**: [Open Data Commons Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/)
- **Attribution**: © OpenStreetMap contributors, licensed under the Open Database License (ODbL).

---

## 4. Coverage Limitations & "Other / Not listed" Workflow

- **No Claim of Exhaustiveness**: Open datasets do not possess 100% of local dirt roads, newly developed compounds, or unmapped rural hamlets in The Gambia.
- **Other / Not listed Fallback**:
  - The dropdown includes a dedicated **Other / Not listed** option (`value: 'OTHER'`).
  - When selected, the form reveals a **required text input**: *"Specify Community, Street or Landmark \*"*.
  - This allows citizens anywhere in The Gambia to report infrastructure issues even if their exact compound, lane, or neighborhood is not yet represented in public gazetteers.
- **Street Number Requirement**:
  - The required **Street Number** input is preserved in all workflows (both for verified dropdown selections and "Other / Not listed" submissions).
- **Backend Validation**:
  - Backend Zod schemas and services validate the geographic inputs. Cross-LGA submissions (e.g. choosing Banjul City Council with a Basse location ID) are rejected. Submissions with "Other" but missing custom text are rejected.

---

## 5. How to Update the Location Dataset

To refresh or update the dataset as GeoNames or OpenStreetMap add new locations in The Gambia:

1. **Run the dataset compiler**:
   ```bash
   node compile_locations.js
   ```
   This script:
   - Reads the latest `gm_geonames/GM.txt` extract.
   - Reads the latest `osm_gm_raw.json` extract.
   - Cleans and deduplicates names and stable identifiers (`gn-<id>` and `osm-<type>-<id>`).
   - Maps each entry to its official Local Government Area based on administrative codes and validated river/territorial coordinates.
   - Generates `apps/api/src/data/gambia-locations.json`.

2. **Verify changes**:
   ```bash
   npm test
   npm run typecheck:api
   npm run typecheck:web
   ```

3. **Rebuild**:
   ```bash
   npm run build:api
   npm run build:web
   ```
