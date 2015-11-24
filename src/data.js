'use strict';

export function importData (space, data, contentTypes) {
  return space.getEntries().then((entries) => {
    return Promise.all([
      importAuthors(entries, space, data, contentTypes.author),
      importTags(entries, space, data, contentTypes.tag),
      importPosts(entries, space, data, contentTypes.post)
    ]);
  });
}

function importAuthors (entries, space, data, authorContentType) {
  return importEntities(...arguments, 'author', (author) => {
    return {
      sys: { id: author.slug },
      fields: {
        name: { 'en-US': author.name },
        slug: { 'en-US': author.slug },
        email: { 'en-US': author.email },
        image: { 'en-US': author.image }
      }
    };
  });
}

function importTags (entries, space, data, contentTypes) {
  return importEntities(...arguments, 'tag', (tag) => {
    return {
      sys: { id: tag.slug },
      fields: {
        name: { 'en-US': tag.name },
        slug: { 'en-US': tag.slug },
        description: { 'en-US': tag.description }
      }
    };
  });
}

function importPosts (entries, space, data, contentTypes) {
  return importEntities(...arguments, 'post', (post) => {
    return {
      fields: {
        title: { 'en-US': post.title },
        slug: { 'en-US': post.slug },
        body: { 'en-US': post.markdown },
        legacyImage: { 'en-US': post.image },
        metaTitle: { 'en-US': post.meta_title },
        metaDescription: { 'en-US': post.meta_description },
        publishedAt: { 'en-US': post.published_at },
        author: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: findAuthorById(data.authors, post.author_id).slug
            }
          }
        }
      }
    };
  });
}

function findAuthorById (authors, id) {
  return authors.find((author) => (author.id === id));
}

function importEntities (entries, space, entities, entityContentType, entityName, dataMapper) {
  return Promise.all(
    entities[`${entityName}s`].map((entityData) => {
      let entity = entries.find((entry) => entry.sys.id === entityData.slug);

      if (entity) {
        console.log(`- The ${entityName} "${entityData.slug}" already exists`);
        return entity;
      }

      return space
        .createEntry(entityContentType, dataMapper(entityData))
        .catch(console.log)
        .then((entity) => {
          console.log(`- Created ${entityName} "${entityData.slug}"`);

          if (!entityData.status || (entityData.status === 'published')) {
            return space.publishEntry(entity).then((entity) => {
              console.log(`- Published ${entityName} "${entityData.slug}"`);
              return entity;
            });
          }
        });
    })
  );
}
