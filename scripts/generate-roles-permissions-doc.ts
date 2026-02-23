import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RolesService } from '../src/modules/roles/roles.service';
import { PermissionsService } from '../src/modules/permissions/permissions.service';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger('RolesPermissionsDoc');

async function generateDoc() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const rolesService = app.get(RolesService);
    const permissionsService = app.get(PermissionsService);

    logger.log('Fetching roles and permissions...');

    // Get all roles and permissions
    const roles = await rolesService.findAll();
    const allPermissions = await permissionsService.findAll();

    // Group permissions by category
    const permissionsByCategory = allPermissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, any[]>);

    // Generate markdown content
    let markdown = '# Roles and Permissions Documentation\n\n';
    markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;
    markdown += '---\n\n';

    // Table of Contents
    markdown += '## Table of Contents\n\n';
    markdown += '1. [Roles Overview](#roles-overview)\n';
    markdown += '2. [Roles Details](#roles-details)\n';
    markdown += '3. [Permissions by Category](#permissions-by-category)\n';
    markdown += '4. [Permission Matrix](#permission-matrix)\n\n';
    markdown += '---\n\n';

    // Roles Overview
    markdown += '## Roles Overview\n\n';
    markdown += '| Role | Display Name | Hierarchy | System Role | Permissions Count |\n';
    markdown += '|------|--------------|-----------|-------------|-------------------|\n';

    roles.sort((a, b) => (a.hierarchy || 999) - (b.hierarchy || 999));

    for (const role of roles) {
      const permCount = Array.isArray(role.permissions) ? role.permissions.length : 0;
      markdown += `| ${role.name} | ${role.displayName} | ${role.hierarchy || 'N/A'} | ${role.isSystemRole ? 'Yes' : 'No'} | ${permCount} |\n`;
    }

    markdown += '\n---\n\n';

    // Roles Details
    markdown += '## Roles Details\n\n';

    for (const role of roles) {
      markdown += `### ${role.displayName} (\`${role.name}\`)\n\n`;
      markdown += `**Description:** ${role.description || 'No description provided'}\n\n`;
      markdown += `**Hierarchy Level:** ${role.hierarchy || 'Not specified'}\n\n`;
      markdown += `**System Role:** ${role.isSystemRole ? 'Yes' : 'No'}\n\n`;

      const rolePermissions = Array.isArray(role.permissions) ? role.permissions : [];

      if (rolePermissions.length > 0) {
        markdown += `**Permissions (${rolePermissions.length}):**\n\n`;

        // Group role permissions by category
        const rolePermsByCategory: Record<string, any[]> = {};

        for (const perm of rolePermissions) {
          const permObj = typeof perm === 'string'
            ? allPermissions.find(p => p._id.toString() === perm || p.name === perm)
            : perm;

          if (permObj) {
            const category = (permObj as any).category || 'Uncategorized';
            if (!rolePermsByCategory[category]) {
              rolePermsByCategory[category] = [];
            }
            rolePermsByCategory[category].push(permObj);
          }
        }

        for (const [category, perms] of Object.entries(rolePermsByCategory).sort()) {
          markdown += `#### ${category}\n\n`;
          for (const perm of perms) {
            markdown += `- **${(perm as any).displayName}** (\`${(perm as any).name}\`)\n`;
            markdown += `  - ${(perm as any).description}\n`;
          }
          markdown += '\n';
        }
      } else {
        markdown += '**Permissions:** None assigned\n\n';
      }

      markdown += '---\n\n';
    }

    // Permissions by Category
    markdown += '## Permissions by Category\n\n';

    for (const [category, perms] of Object.entries(permissionsByCategory).sort()) {
      markdown += `### ${category}\n\n`;
      markdown += '| Permission Name | Display Name | Description | Resource | Action |\n';
      markdown += '|----------------|--------------|-------------|----------|--------|\n';

      for (const perm of perms) {
        const description = perm.description.replace(/\|/g, '\\|');
        markdown += `| \`${perm.name}\` | ${perm.displayName} | ${description} | ${perm.resource} | ${perm.action} |\n`;
      }

      markdown += '\n';
    }

    markdown += '---\n\n';

    // Permission Matrix
    markdown += '## Permission Matrix\n\n';
    markdown += 'This matrix shows which roles have which permissions.\n\n';

    // Create matrix header
    markdown += '| Permission |';
    for (const role of roles) {
      markdown += ` ${role.displayName} |`;
    }
    markdown += '\n';

    markdown += '|------------|';
    for (const role of roles) {
      markdown += '---------|';
    }
    markdown += '\n';

    // Create matrix rows
    for (const perm of allPermissions.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    })) {
      markdown += `| **${perm.displayName}**<br/>\`${perm.name}\` |`;

      for (const role of roles) {
        const rolePerms = Array.isArray(role.permissions) ? role.permissions : [];
        const hasPermission = rolePerms.some(p => {
          if (typeof p === 'string') {
            return p === perm._id.toString() || p === perm.name;
          }
          return (p as any)._id?.toString() === perm._id.toString() || (p as any).name === perm.name;
        });

        markdown += hasPermission ? ' ✅ |' : ' ❌ |';
      }

      markdown += '\n';
    }

    markdown += '\n---\n\n';

    // Footer
    markdown += '## Legend\n\n';
    markdown += '- ✅ = Role has this permission\n';
    markdown += '- ❌ = Role does not have this permission\n';
    markdown += '- **System Role** = Cannot be deleted or modified by regular administrators\n';
    markdown += '- **Hierarchy Level** = Lower numbers indicate higher authority (0 is highest)\n\n';

    // Write to file
    const docsDir = path.join(__dirname, '../../docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const filePath = path.join(docsDir, 'ROLES_AND_PERMISSIONS.md');
    fs.writeFileSync(filePath, markdown, 'utf8');

    logger.log(`✅ Documentation generated successfully!`);
    logger.log(`📄 File saved to: ${filePath}`);
    logger.log(`📊 Total roles: ${roles.length}`);
    logger.log(`📊 Total permissions: ${allPermissions.length}`);

  } catch (error) {
    logger.error('❌ Error generating documentation:', error);
    throw error;
  } finally {
    await app.close();
  }
}

generateDoc()
  .then(() => {
    logger.log('Documentation generation completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Documentation generation failed:', error);
    process.exit(1);
  });
