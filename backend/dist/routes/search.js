"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/items', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string' || query.length < 2) {
            return res.status(400).json({
                error: 'Query must be at least 2 characters'
            });
        }
        const searchTerm = query.trim();
        const weapons = await prisma.weaponModel.findMany({
            where: {
                AND: [
                    { isActive: true },
                    {
                        OR: [
                            { name: { contains: searchTerm, mode: 'insensitive' } },
                            { model: { contains: searchTerm, mode: 'insensitive' } },
                            { version: { contains: searchTerm, mode: 'insensitive' } },
                            { manufacturer: { name: { contains: searchTerm, mode: 'insensitive' } } },
                        ],
                    },
                ],
            },
            include: {
                manufacturer: true,
            },
            take: 15,
        });
        const parts = await prisma.part.findMany({
            where: {
                AND: [
                    { isActive: true },
                    {
                        OR: [
                            { name: { contains: searchTerm, mode: 'insensitive' } },
                            { manufacturer: { contains: searchTerm, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            take: 15,
        });
        const results = [
            ...weapons.map(w => ({
                id: w.id,
                name: w.name,
                type: 'weapon',
                subType: w.weaponType,
                manufacturer: w.manufacturer.name,
                reference: w.model + (w.version ? ` ${w.version}` : ''),
                specs: {
                    gearboxType: w.gearboxType,
                    hopUpType: w.hopUpType,
                    barrelLength: w.barrelLength,
                }
            })),
            ...parts.map(p => ({
                id: p.id,
                name: p.name,
                type: 'part',
                subType: p.partType,
                manufacturer: p.manufacturer,
                reference: p.name,
                price: p.price,
            }))
        ];
        console.log(`[Search] Query: "${searchTerm}" - Found ${weapons.length} weapons, ${parts.length} parts`);
        return res.json(results);
    }
    catch (error) {
        console.error('Error searching items:', error);
        return res.status(500).json({ error: 'Failed to search items' });
    }
});
router.get('/compatibility/:item1Id/:item2Id', async (req, res) => {
    try {
        const { item1Id, item2Id } = req.params;
        if (!item1Id || !item2Id) {
            return res.status(400).json({
                error: 'Both item IDs are required'
            });
        }
        if (item1Id === item2Id) {
            return res.status(400).json({
                error: 'Cannot check compatibility of an item with itself'
            });
        }
        const [weapon1, weapon2, part1, part2] = await Promise.all([
            prisma.weaponModel.findUnique({
                where: { id: item1Id },
                include: { manufacturer: true }
            }),
            prisma.weaponModel.findUnique({
                where: { id: item2Id },
                include: { manufacturer: true }
            }),
            prisma.part.findUnique({ where: { id: item1Id } }),
            prisma.part.findUnique({ where: { id: item2Id } }),
        ]);
        const item1 = weapon1 || part1;
        const item2 = weapon2 || part2;
        if (!item1 || !item2) {
            return res.status(404).json({
                error: 'Un ou les deux équipements sont introuvables dans notre base de données'
            });
        }
        const hasWeaponAndPart = (weapon1 && part2) || (weapon2 && part1);
        if (!hasWeaponAndPart) {
            return res.json({
                compatible: false,
                verified: false,
                warning: '⚠️ VÉRIFICATION IMPOSSIBLE',
                message: 'Le Gearcheck System ne peut vérifier que la compatibilité entre une arme et une pièce. Sélectionnez une arme et une pièce pour continuer.',
            });
        }
        let compatibilityInfo = null;
        if (weapon1 && part2) {
            compatibilityInfo = await prisma.partCompatibility.findUnique({
                where: {
                    weaponModelId_partId: {
                        weaponModelId: weapon1.id,
                        partId: part2.id,
                    },
                },
            });
        }
        else if (weapon2 && part1) {
            compatibilityInfo = await prisma.partCompatibility.findUnique({
                where: {
                    weaponModelId_partId: {
                        weaponModelId: weapon2.id,
                        partId: part1.id,
                    },
                },
            });
        }
        if (!compatibilityInfo) {
            return res.json({
                compatible: false,
                verified: false,
                warning: '⚠️ AUCUNE DONNÉE CERTIFIÉE',
                message: 'Aucune donnée de compatibilité certifiée n\'est disponible pour cette combinaison dans notre base de données.',
                recommendation: '🚫 N\'ACHETEZ PAS sans vérifier auprès du fabricant ou d\'un expert. Le Gearcheck System ne peut garantir la compatibilité sans données certifiées.'
            });
        }
        const isFullyCompatible = compatibilityInfo.compatibilityScore >= 98;
        const requiresMinorModifications = compatibilityInfo.compatibilityScore >= 90 && compatibilityInfo.compatibilityScore < 98;
        const isNotCompatible = compatibilityInfo.compatibilityScore < 90;
        return res.json({
            compatible: isFullyCompatible,
            verified: true,
            score: compatibilityInfo.compatibilityScore,
            requiresModification: compatibilityInfo.requiresModification,
            notes: compatibilityInfo.notes,
            warning: isNotCompatible
                ? '🚫 NON COMPATIBLE'
                : requiresMinorModifications
                    ? '⚠️ MODIFICATIONS REQUISES'
                    : null,
            message: isFullyCompatible
                ? '✅ COMPATIBILITÉ CERTIFIÉE - Ces équipements fonctionnent ensemble sans modification.'
                : requiresMinorModifications
                    ? '⚠️ COMPATIBLE AVEC MODIFICATIONS - Des ajustements mineurs sont nécessaires. Consultez un expert avant l\'achat.'
                    : '🚫 NON COMPATIBLE - Ces équipements ne fonctionnent pas ensemble. N\'achetez pas cette combinaison.',
        });
    }
    catch (error) {
        console.error('Error checking compatibility:', error);
        return res.status(500).json({
            error: 'Erreur lors de la vérification de compatibilité',
            compatible: false,
            verified: false,
        });
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map