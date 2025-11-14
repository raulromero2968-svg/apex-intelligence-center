// TCG Sets Database
// Comprehensive database for Set Completion Calculator

const SETS_DATABASE = {
    pokemon: [
        {
            id: 'pokemon_151',
            name: '151 (2023)',
            releaseDate: '2023-09-22',
            packPrice: 4.49,
            cards: [
                // Commons (1-50 sample)
                { number: '001', name: 'Bulbasaur', rarity: 'Common', price: 0.25 },
                { number: '002', name: 'Ivysaur', rarity: 'Common', price: 0.30 },
                { number: '003', name: 'Venusaur', rarity: 'Uncommon', price: 0.75 },
                { number: '004', name: 'Charmander', rarity: 'Common', price: 0.50 },
                { number: '005', name: 'Charmeleon', rarity: 'Common', price: 0.40 },
                { number: '006', name: 'Charizard', rarity: 'Rare', price: 4.50 },
                { number: '007', name: 'Squirtle', rarity: 'Common', price: 0.45 },
                { number: '008', name: 'Wartortle', rarity: 'Common', price: 0.35 },
                { number: '009', name: 'Blastoise', rarity: 'Uncommon', price: 0.85 },
                { number: '010', name: 'Caterpie', rarity: 'Common', price: 0.15 },
                { number: '025', name: 'Pikachu', rarity: 'Common', price: 1.25 },
                { number: '026', name: 'Raichu', rarity: 'Uncommon', price: 0.90 },
                { number: '094', name: 'Gengar', rarity: 'Rare', price: 3.50 },
                { number: '130', name: 'Gyarados', rarity: 'Rare', price: 2.75 },
                { number: '143', name: 'Snorlax', rarity: 'Uncommon', price: 1.10 },
                { number: '150', name: 'Mewtwo', rarity: 'Rare', price: 5.50 },
                { number: '151', name: 'Mew', rarity: 'Rare', price: 6.00 },
                // Reverse Holos
                { number: '001', name: 'Bulbasaur (Reverse Holo)', rarity: 'Holo Rare', price: 2.50 },
                { number: '025', name: 'Pikachu (Reverse Holo)', rarity: 'Holo Rare', price: 8.00 },
                // Ultra Rares (ex cards)
                { number: '163', name: 'Venusaur ex', rarity: 'Ultra Rare', price: 18.50 },
                { number: '165', name: 'Charizard ex', rarity: 'Ultra Rare', price: 85.00 },
                { number: '166', name: 'Blastoise ex', rarity: 'Ultra Rare', price: 22.00 },
                { number: '183', name: 'Mew ex', rarity: 'Ultra Rare', price: 45.00 },
                { number: '184', name: 'Mewtwo ex', rarity: 'Ultra Rare', price: 38.00 },
                { number: '185', name: 'Eevee ex', rarity: 'Ultra Rare', price: 32.00 },
                { number: '186', name: 'Zapdos ex', rarity: 'Ultra Rare', price: 25.00 },
                { number: '191', name: 'Alakazam ex', rarity: 'Ultra Rare', price: 20.00 },
                // Full Art Trainers
                { number: '195', name: 'Erika\'s Invitation (Full Art)', rarity: 'Ultra Rare', price: 55.00 },
                { number: '196', name: 'Giovanni\'s Charisma (Full Art)', rarity: 'Ultra Rare', price: 28.00 },
                // Secret Rares
                { number: '197', name: 'Bulbasaur (Illustration Rare)', rarity: 'Secret Rare', price: 12.00 },
                { number: '201', name: 'Charizard (Illustration Rare)', rarity: 'Secret Rare', price: 165.00 },
                { number: '204', name: 'Pikachu (Illustration Rare)', rarity: 'Secret Rare', price: 45.00 },
                { number: '207', name: 'Mew (Illustration Rare)', rarity: 'Secret Rare', price: 75.00 },
                { number: '211', name: 'Erika\'s Invitation (Special Illustration Rare)', rarity: 'Secret Rare', price: 285.00 },
                { number: '212', name: 'Alakazam ex (Special Illustration Rare)', rarity: 'Secret Rare', price: 95.00 },
                { number: '213', name: 'Charizard ex (Special Illustration Rare)', rarity: 'Secret Rare', price: 650.00 },
                { number: '214', name: 'Mew ex (Special Illustration Rare)', rarity: 'Secret Rare', price: 180.00 },
                { number: '215', name: 'Mewtwo ex (Special Illustration Rare)', rarity: 'Secret Rare', price: 220.00 }
            ]
        },
        {
            id: 'pokemon_evolving_skies',
            name: 'Evolving Skies (2021)',
            releaseDate: '2021-08-27',
            packPrice: 4.19,
            cards: [
                // Commons
                { number: '001', name: 'Oddish', rarity: 'Common', price: 0.10 },
                { number: '002', name: 'Gloom', rarity: 'Common', price: 0.12 },
                { number: '003', name: 'Vileplume', rarity: 'Uncommon', price: 0.20 },
                { number: '004', name: 'Spinarak', rarity: 'Common', price: 0.08 },
                { number: '005', name: 'Ariados', rarity: 'Uncommon', price: 0.18 },
                { number: '024', name: 'Medicham V', rarity: 'Rare', price: 1.50 },
                { number: '075', name: 'Rayquaza V', rarity: 'Rare', price: 3.75 },
                { number: '089', name: 'Sylveon V', rarity: 'Rare', price: 2.25 },
                { number: '094', name: 'Umbreon V', rarity: 'Rare', price: 8.50 },
                { number: '143', name: 'Rayquaza VMAX', rarity: 'Ultra Rare', price: 45.00 },
                { number: '189', name: 'Sylveon VMAX', rarity: 'Ultra Rare', price: 28.00 },
                { number: '202', name: 'Umbreon VMAX', rarity: 'Ultra Rare', price: 165.00 },
                { number: '203', name: 'Umbreon VMAX (Alternate Art)', rarity: 'Secret Rare', price: 485.00 },
                { number: '204', name: 'Sylveon VMAX (Alternate Art)', rarity: 'Secret Rare', price: 220.00 },
                { number: '205', name: 'Glaceon VMAX (Alternate Art)', rarity: 'Secret Rare', price: 195.00 },
                { number: '206', name: 'Rayquaza VMAX (Alternate Art)', rarity: 'Secret Rare', price: 385.00 },
                { number: '215', name: 'Zinnia\'s Resolve (Full Art)', rarity: 'Ultra Rare', price: 12.00 },
                { number: '234', name: 'Leafeon V (Alternate Art)', rarity: 'Secret Rare', price: 145.00 }
            ]
        },
        {
            id: 'pokemon_crown_zenith',
            name: 'Crown Zenith (2023)',
            releaseDate: '2023-01-20',
            packPrice: 4.29,
            cards: [
                { number: '001', name: 'Weedle', rarity: 'Common', price: 0.12 },
                { number: '002', name: 'Kakuna', rarity: 'Common', price: 0.10 },
                { number: '003', name: 'Beedrill', rarity: 'Uncommon', price: 0.25 },
                { number: '059', name: 'Pikachu', rarity: 'Common', price: 0.85 },
                { number: '071', name: 'Regieleki V', rarity: 'Rare', price: 1.75 },
                { number: '115', name: 'Mewtwo V', rarity: 'Rare', price: 3.25 },
                { number: '127', name: 'Giratina V', rarity: 'Rare', price: 2.50 },
                { number: '139', name: 'Giratina VSTAR', rarity: 'Ultra Rare', price: 22.00 },
                { number: '145', name: 'Mewtwo VSTAR', rarity: 'Ultra Rare', price: 18.50 },
                { number: 'GG01', name: 'Pikachu (Galarian Gallery)', rarity: 'Holo Rare', price: 8.00 },
                { number: 'GG70', name: 'Mewtwo VSTAR (Galarian Gallery)', rarity: 'Secret Rare', price: 145.00 },
                { number: 'GG71', name: 'Giratina VSTAR (Galarian Gallery)', rarity: 'Secret Rare', price: 225.00 }
            ]
        },
        {
            id: 'pokemon_paldean_fates',
            name: 'Paldean Fates (2024)',
            releaseDate: '2024-01-26',
            packPrice: 4.39,
            cards: [
                { number: '001', name: 'Oddish', rarity: 'Common', price: 0.15 },
                { number: '002', name: 'Gloom', rarity: 'Common', price: 0.18 },
                { number: '036', name: 'Iron Valiant ex', rarity: 'Rare', price: 4.50 },
                { number: '091', name: 'Mew ex', rarity: 'Rare', price: 6.75 },
                { number: '094', name: 'Iron Valiant ex (Full Art)', rarity: 'Ultra Rare', price: 18.00 },
                { number: '245', name: 'Iono (Special Illustration Rare)', rarity: 'Secret Rare', price: 325.00 },
                { number: '246', name: 'Perrin (Special Illustration Rare)', rarity: 'Secret Rare', price: 95.00 },
                { number: 'SV001', name: 'Sprigatito (Shiny)', rarity: 'Holo Rare', price: 12.00 },
                { number: 'SV094', name: 'Mew (Shiny)', rarity: 'Secret Rare', price: 65.00 }
            ]
        }
    ],
    mtg: [
        {
            id: 'mtg_bloomburrow',
            name: 'Bloomburrow (2024)',
            releaseDate: '2024-08-02',
            packPrice: 4.99,
            cards: [
                { number: '001', name: 'Blooming Blast', rarity: 'Common', price: 0.10 },
                { number: '002', name: 'Brightblade Stoat', rarity: 'Common', price: 0.08 },
                { number: '003', name: 'Bumbleflower', rarity: 'Common', price: 0.12 },
                { number: '025', name: 'Pearl of Wisdom', rarity: 'Uncommon', price: 0.35 },
                { number: '187', name: 'Mabel, Heir to Cragflame', rarity: 'Rare', price: 2.50 },
                { number: '201', name: 'Baylen, the Haymaker', rarity: 'Rare', price: 8.50 },
                { number: '258', name: 'Ygra, Eater of All', rarity: 'Rare', price: 3.75 },
                { number: '289', name: 'Three Tree City', rarity: 'Rare', price: 12.00 },
                { number: '303', name: 'Mabel (Borderless)', rarity: 'Rare', price: 6.50 },
                { number: '321', name: 'Lumra, Bellow of the Woods', rarity: 'Ultra Rare', price: 45.00 },
                { number: '355', name: 'Ral, Crackling Wit (Borderless)', rarity: 'Ultra Rare', price: 32.00 }
            ]
        },
        {
            id: 'mtg_murders_karlov',
            name: 'Murders at Karlov Manor (2024)',
            releaseDate: '2024-02-09',
            packPrice: 4.99,
            cards: [
                { number: '001', name: 'Analyze the Pollen', rarity: 'Common', price: 0.15 },
                { number: '002', name: 'Auspicious Arrival', rarity: 'Common', price: 0.10 },
                { number: '025', name: 'Case of the Locked Hothouse', rarity: 'Uncommon', price: 0.45 },
                { number: '187', name: 'Toxicrene', rarity: 'Rare', price: 1.25 },
                { number: '234', name: 'Yarus, Roar of the Old Gods', rarity: 'Rare', price: 3.50 },
                { number: '276', name: 'Teysa Karlov', rarity: 'Ultra Rare', price: 28.00 },
                { number: '327', name: 'Niv-Mizzet, Guildpact (Serialized)', rarity: 'Secret Rare', price: 1250.00 }
            ]
        }
    ],
    yugioh: [
        {
            id: 'yugioh_quarter_century',
            name: 'Quarter Century Bonanza (2024)',
            releaseDate: '2024-05-31',
            packPrice: 3.99,
            cards: [
                { number: 'QCCB-EN001', name: 'Blue-Eyes White Dragon', rarity: 'Ultra Rare', price: 45.00 },
                { number: 'QCCB-EN002', name: 'Dark Magician', rarity: 'Ultra Rare', price: 38.00 },
                { number: 'QCCB-EN012', name: 'Exodia the Forbidden One', rarity: 'Secret Rare', price: 85.00 },
                { number: 'QCCB-EN025', name: 'Ash Blossom & Joyous Spring', rarity: 'Ultra Rare', price: 22.00 },
                { number: 'QCCB-EN073', name: 'Pot of Prosperity', rarity: 'Secret Rare', price: 65.00 }
            ]
        },
        {
            id: 'yugioh_age_overlord',
            name: 'Age of Overlord (2023)',
            releaseDate: '2023-09-21',
            packPrice: 3.99,
            cards: [
                { number: 'AGOV-EN001', name: 'Purrely Delicious Memory', rarity: 'Common', price: 0.25 },
                { number: 'AGOV-EN005', name: 'Purrely Happy Memory', rarity: 'Common', price: 0.30 },
                { number: 'AGOV-EN023', name: 'Horus the Black Flame Dragon LV8', rarity: 'Ultra Rare', price: 12.00 },
                { number: 'AGOV-EN080', name: 'Snake-Eye Ash', rarity: 'Secret Rare', price: 95.00 },
                { number: 'AGOV-EN081', name: 'Snake-Eyes Poplar', rarity: 'Ultra Rare', price: 45.00 }
            ]
        }
    ],
    onepiece: [
        {
            id: 'onepiece_op01',
            name: 'Romance Dawn (OP-01)',
            releaseDate: '2022-12-02',
            packPrice: 3.99,
            cards: [
                { number: 'OP01-001', name: 'Monkey D. Luffy', rarity: 'Common', price: 1.25 },
                { number: 'OP01-003', name: 'Roronoa Zoro', rarity: 'Common', price: 0.85 },
                { number: 'OP01-016', name: 'Nami', rarity: 'Uncommon', price: 0.65 },
                { number: 'OP01-024', name: 'Monkey D. Luffy (Leader)', rarity: 'Rare', price: 4.50 },
                { number: 'OP01-060', name: 'Shanks', rarity: 'Secret Rare', price: 125.00 },
                { number: 'OP01-061', name: 'Yamato', rarity: 'Secret Rare', price: 85.00 },
                { number: 'OP01-091', name: 'Nami (Alternate Art)', rarity: 'Secret Rare', price: 165.00 },
                { number: 'OP01-121', name: 'Luffy (Manga Rare)', rarity: 'Secret Rare', price: 450.00 }
            ]
        },
        {
            id: 'onepiece_op06',
            name: 'Wings of the Captain (OP-06)',
            releaseDate: '2024-03-29',
            packPrice: 3.99,
            cards: [
                { number: 'OP06-001', name: 'Monkey D. Luffy (Gear 5)', rarity: 'Common', price: 2.50 },
                { number: 'OP06-007', name: 'Nico Robin', rarity: 'Uncommon', price: 1.20 },
                { number: 'OP06-022', name: 'Sanji', rarity: 'Rare', price: 3.75 },
                { number: 'OP06-074', name: 'Monkey D. Luffy (Secret Rare)', rarity: 'Secret Rare', price: 285.00 },
                { number: 'OP06-118', name: 'Nico Robin (Alternate Art)', rarity: 'Secret Rare', price: 195.00 }
            ]
        }
    ]
};
