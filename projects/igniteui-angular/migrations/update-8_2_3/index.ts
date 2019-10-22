import {
    Rule,
    SchematicContext,
    Tree
} from '@angular-devkit/schematics';
import { UpdateChanges } from '../common/UpdateChanges';

const version = '8.2.3';

export default function(): Rule {
    return (host: Tree, context: SchematicContext) => {
        context.logger.info(`Applying migration for Ignite UI for Angular to version ${version}`);

        const update = new UpdateChanges(__dirname, host, context);
        update.applyChanges();
    };
}
