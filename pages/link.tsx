import type { ComponentProps } from 'react';
import { sitePath } from '../lib/site-path';
/** GitHub Pages serves each route as a real static HTML file. */
export default function Link({href, ...props}: ComponentProps<'a'> & {href:string}) {
  const local = href.startsWith('/') && !href.startsWith('//');
  return <a href={local ? sitePath(href) : href} {...props}/>;
}
