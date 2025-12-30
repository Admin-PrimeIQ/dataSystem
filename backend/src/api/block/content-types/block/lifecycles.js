'use strict';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const slugifyLib = require('slugify');
// @ts-ignore - slugify is a function but types may not be properly defined
const slugify = slugifyLib.default || slugifyLib;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const createError = require('http-errors');

/**
 * Get project name from data.project
 * Handles different formats for different scenarios:
 * - CREATION: connect with id only
 * - CLONING: set with connect containing documentId
 * - UPDATE: connect/disconnect with empty arrays (relation not being changed)
 * - DIRECT: Object with .name property or ID string/number
 * 
 * @param {any} projectData - The project data (can be object, string, number, or undefined)
 * @returns {Promise<string>} - Project name or empty string
 */
async function getProjectName(projectData) {
    // If no project data, return empty
    if (!projectData) {
        return '';
    }

    // Case 1: projectData is already an object with name property (already populated)
    if (typeof projectData === 'object' && projectData.name) {
        return projectData.name;
    }

    // Case 2: CLONING - projectData has set/connect/disconnect operators
    // Structure: { set: [{ connect: [{ documentId: "...", id: 1 }] }] }
    // OR: { set: [{ id: "26" }] } or { set: [{ documentId: "26" }] }
    if (typeof projectData === 'object' && 'set' in projectData && Array.isArray(projectData.set)) {
        if (projectData.set.length > 0) {
            const setItem = projectData.set[0];
            
            // Case 2a: set[0] has connect array (nested structure)
            if (setItem.connect && Array.isArray(setItem.connect) && setItem.connect.length > 0) {
                const connectItem = setItem.connect[0];
                // Cloning: use documentId if available
                if (connectItem.documentId) {
                    try {
                        const project = await strapi.documents('api::project.project').findOne({
                            documentId: connectItem.documentId,
                            fields: ['name'],
                        });
                        if (project && project.name) {
                            return project.name;
                        }
                    } catch (error) {
                        return '';
                    }
                }
                // Fallback: use id if documentId not available
                if (connectItem.id) {
                    try {
                        const project = await strapi.entityService.findOne('api::project.project', connectItem.id, {
                            fields: ['name'],
                        });
                        if (project && project.name) {
                            return project.name;
                        }
                    } catch (error) {
                        return '';
                    }
                }
            }
            
            // Case 2b: set[0] has documentId directly (without connect)
            if (setItem.documentId) {
                try {
                    const project = await strapi.documents('api::project.project').findOne({
                        documentId: setItem.documentId,
                        fields: ['name'],
                    });
                    if (project && project.name) {
                        return project.name;
                    }
                } catch (error) {
                    return '';
                }
            }
            
            // Case 2c: set[0] has id directly (without connect)
            if (setItem.id) {
                try {
                    const project = await strapi.entityService.findOne('api::project.project', setItem.id, {
                        fields: ['name'],
                    });
                    if (project && project.name) {
                        return project.name;
                    }
                } catch (error) {
                    return '';
                }
            }
        }
        return '';
    }

    // Case 3: CREATION - projectData has connect with id only
    // Structure: { connect: [{ id: 1 }] }
    if (typeof projectData === 'object' && 'connect' in projectData && Array.isArray(projectData.connect) && projectData.connect.length > 0) {
        const connectItem = projectData.connect[0];
        // Creation: use documentId if available (newer format)
        if (connectItem.documentId) {
            try {
                const project = await strapi.documents('api::project.project').findOne({
                    documentId: connectItem.documentId,
                    fields: ['name'],
                });
                if (project && project.name) {
                    return project.name;
                }
            } catch (error) {
                return '';
            }
        }
        // Creation: use id (standard format)
        if (connectItem.id) {
            try {
                const project = await strapi.entityService.findOne('api::project.project', connectItem.id, {
                    fields: ['name'],
                });
                if (project && project.name) {
                    return project.name;
                }
            } catch (error) {
                return '';
            }
        }
        return '';
    }

    // Case 4: UPDATE - projectData has connect/disconnect with empty arrays
    // Structure: { connect: [], disconnect: [] } - relation not being changed
    if (typeof projectData === 'object' && ('connect' in projectData || 'disconnect' in projectData)) {
        // Return empty - the project should be fetched from the existing block in beforeUpdate
        return '';
    }

    // Case 3: projectData is a string or number (ID)
    if (typeof projectData === 'string' || typeof projectData === 'number') {
        try {
            const project = await strapi.entityService.findOne('api::project.project', projectData, {
                fields: ['name'],
            });

            if (project && project.name) {
                return project.name;
            }
        } catch (error) {
            return '';
        }
    }

    // Case 4: projectData is an object but doesn't have name (might be ID object)
    if (typeof projectData === 'object') {
        // Try to extract ID from object
        let projectId = null;

        if ('id' in projectData) {
            projectId = projectData.id;
        } else if ('documentId' in projectData) {
            projectId = projectData.documentId;
        }

        if (projectId) {
            try {
                const project = await strapi.entityService.findOne('api::project.project', projectId, {
                    fields: ['name'],
                });

                if (project && project.name) {
                    return project.name;
                }
            } catch (error) {
                return '';
            }
        }
    }

    return '';
}

/**
 * Build block name from project and block details
 * Format: "Proyecto - Fase - Sector - Torre"
 * Example: "Vistas de Santa Elena - Fase 1 - Sector 1 - Torre A"
 * Only includes components that have values
 */
async function buildBlockName(data) {
    const parts = [];

    // Get project name first
    const projectName = await getProjectName(data.project);
    if (projectName) {
        parts.push(projectName);
    }

    // Add phase if exists
    if (data.phase && data.phase.trim()) {
        parts.push(`Fase ${data.phase.trim()}`);
    }

    // Add sector if exists
    if (data.sector && data.sector.trim()) {
        parts.push(`Sector ${data.sector.trim()}`);
    }

    // Add tower if exists
    if (data.tower && data.tower.trim()) {
        parts.push(`Torre ${data.tower.trim()}`);
    }

    // Join all parts with " - " or return empty string if no parts
    return parts.length > 0 ? parts.join(' - ') : '';
}

module.exports = {
    // CREATION: Triggered when creating a new block
    // project structure: { connect: [{ id: 1 }] }
    async beforeCreate(event) {
        const { data } = event.params;

        // Validate that project is required and can be resolved
        const projectName = await getProjectName(data.project);
        if (!projectName || projectName.trim() === '') {
            throw createError(400, 'Project is required. A block cannot be created without a valid project.');
        }

        // Build the block name dynamically (getProjectName handles creation format)
        const blockName = await buildBlockName(data);

        if (blockName) {
            data.name = blockName;
            // Generate code from name using slugify
            // @ts-ignore - slugify is callable at runtime
            data.code = slugify(blockName, {
                lower: true,
                strict: true,
                locale: 'es'
            });
        }

        return event;
    },

    // UPDATE: Triggered when updating an existing block
    // project structure: { connect: [], disconnect: [] } (relation not being changed)
    // CLONING: Also triggered when cloning, but project has set structure (handled in getProjectName)
    async beforeUpdate(event) {
        const { data } = event.params;

        // If project has connect/disconnect operators with empty arrays (UPDATE scenario),
        // we need to get the project from the existing block
        let projectData = data.project;

        // UPDATE: Check if both connect and disconnect exist and are empty arrays
        // This indicates the relation is not being changed
        if (
            projectData &&
            typeof projectData === 'object' &&
            'connect' in projectData &&
            'disconnect' in projectData &&
            Array.isArray(projectData.connect) &&
            Array.isArray(projectData.disconnect) &&
            projectData.connect.length === 0 &&
            projectData.disconnect.length === 0
        ) {
            // UPDATE: Extract block documentId from data to fetch existing project
            const blockDocumentId = data.documentId;

            if (blockDocumentId) {
                try {
                    // In Strapi 5, use Document Service API to find by documentId
                    const existingBlock = await strapi.documents('api::block.block').findOne({
                        documentId: blockDocumentId,
                        populate: ['project'],
                    });

                    if (existingBlock && existingBlock.project) {
                        // Use the existing project instead of the connect/disconnect operators
                        projectData = existingBlock.project;
                    }
                } catch (error) {
                    // Silently fail - continue without project name
                }
            }
        }

        // Create a copy of data with the correct project
        const dataWithProject = {
            ...data,
            project: projectData,
        };

        // Validate that project is required and can be resolved
        const projectName = await getProjectName(dataWithProject.project);
        if (!projectName || projectName.trim() === '') {
            throw createError(400, 'Project is required. A block cannot exist without a valid project. (please insert again all the information)');
        }

        // Build the block name dynamically
        const blockName = await buildBlockName(dataWithProject);

        if (blockName) {
            data.name = blockName;
            // Generate code from name using slugify
            // @ts-ignore - slugify is callable at runtime
            data.code = slugify(blockName, {
                lower: true,
                strict: true,
                locale: 'es'
            });
        }

        return event;
    },
};

