'use strict';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const slugifyLib = require('slugify');
// @ts-ignore - slugify is a function but types may not be properly defined
const slugify = slugifyLib.default || slugifyLib;

/**
 * Get block name from data.block
 * Handles different formats for different scenarios:
 * - CREATION: connect with id only
 * - CLONING: set with connect containing documentId
 * - UPDATE: connect/disconnect with empty arrays (relation not being changed)
 * - DIRECT: Object with .name property or ID string/number
 * 
 * @param {any} blockData - The block data (can be object, string, number, or undefined)
 * @returns {Promise<string>} - Block name or empty string
 */
async function getBlockName(blockData) {
    // If no block data, return empty
    if (!blockData) {
        return '';
    }

    // Case 1: blockData is already an object with name property (already populated)
    if (typeof blockData === 'object' && blockData.name) {
        return blockData.name;
    }

    // Case 2: CLONING - blockData has set/connect/disconnect operators
    // Structure: { set: [{ connect: [{ documentId: "...", id: 1 }] }] }
    // OR: { set: [{ id: "26" }] } or { set: [{ documentId: "26" }] }
    if (typeof blockData === 'object' && 'set' in blockData && Array.isArray(blockData.set)) {
        if (blockData.set.length > 0) {
            const setItem = blockData.set[0];
            
            // Case 2a: set[0] has connect array (nested structure)
            if (setItem.connect && Array.isArray(setItem.connect) && setItem.connect.length > 0) {
                const connectItem = setItem.connect[0];
                // Cloning: use documentId if available
                if (connectItem.documentId) {
                    try {
                        const block = await strapi.documents('api::block.block').findOne({
                            documentId: connectItem.documentId,
                            fields: ['name'],
                        });
                        if (block && block.name) {
                            return block.name;
                        }
                    } catch (error) {
                        return '';
                    }
                }
                // Fallback: use id if documentId not available
                if (connectItem.id) {
                    try {
                        const block = await strapi.entityService.findOne('api::block.block', connectItem.id, {
                            fields: ['name'],
                        });
                        if (block && block.name) {
                            return block.name;
                        }
                    } catch (error) {
                        return '';
                    }
                }
            }
            
            // Case 2b: set[0] has documentId directly (without connect)
            if (setItem.documentId) {
                try {
                    const block = await strapi.documents('api::block.block').findOne({
                        documentId: setItem.documentId,
                        fields: ['name'],
                    });
                    if (block && block.name) {
                        return block.name;
                    }
                } catch (error) {
                    return '';
                }
            }
            
            // Case 2c: set[0] has id directly (without connect)
            if (setItem.id) {
                try {
                    const block = await strapi.entityService.findOne('api::block.block', setItem.id, {
                        fields: ['name'],
                    });
                    if (block && block.name) {
                        return block.name;
                    }
                } catch (error) {
                    return '';
                }
            }
        }
        return '';
    }

    // Case 3: CREATION - blockData has connect with id only
    // Structure: { connect: [{ id: 1 }] }
    if (typeof blockData === 'object' && 'connect' in blockData && Array.isArray(blockData.connect) && blockData.connect.length > 0) {
        const connectItem = blockData.connect[0];
        // Creation: use documentId if available (newer format)
        if (connectItem.documentId) {
            try {
                const block = await strapi.documents('api::block.block').findOne({
                    documentId: connectItem.documentId,
                    fields: ['name'],
                });
                if (block && block.name) {
                    return block.name;
                }
            } catch (error) {
                return '';
            }
        }
        // Creation: use id (standard format)
        if (connectItem.id) {
            try {
                const block = await strapi.entityService.findOne('api::block.block', connectItem.id, {
                    fields: ['name'],
                });
                if (block && block.name) {
                    return block.name;
                }
            } catch (error) {
                return '';
            }
        }
        return '';
    }

    // Case 4: UPDATE - blockData has connect/disconnect with empty arrays
    // Structure: { connect: [], disconnect: [] } - relation not being changed
    if (typeof blockData === 'object' && ('connect' in blockData || 'disconnect' in blockData)) {
        // Return empty - the block should be fetched from the existing unit in beforeUpdate
        return '';
    }

    // Case 5: blockData is a string or number (ID)
    if (typeof blockData === 'string' || typeof blockData === 'number') {
        try {
            const block = await strapi.entityService.findOne('api::block.block', blockData, {
                fields: ['name'],
            });

            if (block && block.name) {
                return block.name;
            }
        } catch (error) {
            return '';
        }
    }

    // Case 6: blockData is an object but doesn't have name (might be ID object)
    if (typeof blockData === 'object') {
        // Try to extract ID from object
        let blockId = null;

        if ('id' in blockData) {
            blockId = blockData.id;
        } else if ('documentId' in blockData) {
            blockId = blockData.documentId;
        }

        if (blockId) {
            try {
                const block = await strapi.entityService.findOne('api::block.block', blockId, {
                    fields: ['name'],
                });

                if (block && block.name) {
                    return block.name;
                }
            } catch (error) {
                return '';
            }
        }
    }

    return '';
}

/**
 * Build unit name from block and unit details
 * Format: "Block Name - Unit Number" or "Block Name - Model" or "Block Name - Unit"
 * Only includes components that have values
 */
async function buildUnitName(data) {
    const parts = [];

    // Get block name first
    const blockName = await getBlockName(data.block);
    if (blockName) {
        parts.push(blockName);
    }

    // Add unit number if exists
    if (data.unitNumber && data.unitNumber.trim()) {
        parts.push(`Unit ${data.unitNumber.trim()}`);
    } else if (data.model && data.model.trim()) {
        // Fallback to model if unitNumber doesn't exist
        parts.push(data.model.trim());
    } else if (data.unit && data.unit.trim()) {
        // Fallback to unit if neither unitNumber nor model exist
        parts.push(data.unit.trim());
    }

    // Join all parts with " - " or return empty string if no parts
    return parts.length > 0 ? parts.join(' - ') : '';
}

module.exports = {
    // // CREATION: Triggered when creating a new unit
    // async beforeCreate(event) {
    //     const { data } = event.params;

    //     // Validate that block is required and can be resolved
    //     const blockName = await getBlockName(data.block);
    //     if (!blockName || blockName.trim() === '') {
    //         const createError = require('http-errors');
    //         throw createError(400, 'Block is required. A unit cannot be created without a valid block.');
    //     }

    //     // Build the unit name dynamically
    //     const unitName = await buildUnitName(data);

    //     if (unitName) {
    //         data.name = unitName;
    //         // Generate code from name using slugify
    //         // @ts-ignore - slugify is callable at runtime
    //         data.code = slugify(unitName, {
    //             lower: true,
    //             strict: true,
    //             locale: 'es'
    //         });
    //     }

    //     return event;
    // },

    // // UPDATE: Triggered when updating an existing unit
    // async beforeUpdate(event) {
    //     const { data } = event.params;

    //     // If block has connect/disconnect operators with empty arrays (UPDATE scenario),
    //     // we need to get the block from the existing unit
    //     let blockData = data.block;

    //     // UPDATE: Check if both connect and disconnect exist and are empty arrays
    //     // This indicates the relation is not being changed
    //     if (
    //         blockData &&
    //         typeof blockData === 'object' &&
    //         'connect' in blockData &&
    //         'disconnect' in blockData &&
    //         Array.isArray(blockData.connect) &&
    //         Array.isArray(blockData.disconnect) &&
    //         blockData.connect.length === 0 &&
    //         blockData.disconnect.length === 0
    //     ) {
    //         // UPDATE: Extract unit documentId from data to fetch existing block
    //         const unitDocumentId = data.documentId;

    //         if (unitDocumentId) {
    //             try {
    //                 // In Strapi 5, use Document Service API to find by documentId
    //                 const existingUnit = await strapi.documents('api::unit.unit').findOne({
    //                     documentId: unitDocumentId,
    //                     populate: ['block'],
    //                 });

    //                 if (existingUnit && existingUnit.block) {
    //                     // Use the existing block instead of the connect/disconnect operators
    //                     blockData = existingUnit.block;
    //                 }
    //             } catch (error) {
    //                 // Silently fail - continue without block name
    //             }
    //         }
    //     }

    //     // Create a copy of data with the correct block
    //     const dataWithBlock = {
    //         ...data,
    //         block: blockData,
    //     };

    //     // Validate that block is required and can be resolved
    //     const blockName = await getBlockName(dataWithBlock.block);
    //     if (!blockName || blockName.trim() === '') {
    //         const createError = require('http-errors');
    //         throw createError(400, 'Block is required. A unit cannot exist without a valid block. (please insert again all the information)');
    //     }

    //     // Build the unit name dynamically
    //     const unitName = await buildUnitName(dataWithBlock);

    //     if (unitName) {
    //         data.name = unitName;
    //         // Generate code from name using slugify
    //         // @ts-ignore - slugify is callable at runtime
    //         data.code = slugify(unitName, {
    //             lower: true,
    //             strict: true,
    //             locale: 'es'
    //         });
    //     }

    //     return event;
    // },
};

