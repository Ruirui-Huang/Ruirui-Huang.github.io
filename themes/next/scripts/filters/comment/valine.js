/* global hexo */

'use strict';

const path = require('path');

// Add Valine comment system (manually restored for NexT 8)
hexo.extend.filter.register('theme_inject', injects => {
  const theme = hexo.theme.config;
  if (!theme.valine.enable) return;

  injects.comment.raw('valine', '<div class="comments" id="comments"></div>', {}, { cache: true });

  injects.bodyEnd.file('valine', path.join(hexo.theme_dir, 'layout/_third-party/comments/valine.njk'));

});
