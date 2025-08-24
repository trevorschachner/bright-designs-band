import { InferSelectModel } from 'drizzle-orm';
import { shows, tags, arrangements, files, showsToTags } from '@/lib/database/schema';

export type Show = InferSelectModel<typeof shows> & {
  tags: InferSelectModel<typeof tags>[];
  arrangements: InferSelectModel<typeof arrangements>[];
  files: InferSelectModel<typeof files>[];
  showsToTags?: (InferSelectModel<typeof showsToTags> & { tag: InferSelectModel<typeof tags> })[];
};
