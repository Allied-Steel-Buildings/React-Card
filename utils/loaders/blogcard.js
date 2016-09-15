//Caching disabled until we have full documentation on that process
import client from '../contentful/contentfulClient';
//import cache from '../cache';
import Promise from 'bluebird';
import {get} from 'lodash';
import {postProcessBlogPost} from '../postProcessors/blogPost';

export default (req, res, next) => {

    //let blog = cache.get('blog');
    //let blogPosts = cache.get('blogPosts');

    const promises = [];
    if (blog && blogPosts) {
        if (req.isServerRequest) {
            req.dependentEntries = [{blog}, {blogPosts}];
            return next();
        } else {
            return res.json({
                blog,
                blogPosts
            })
        }
    }

    promises.push(client.getEntries({content_type: 'blog', include: 5}));
    promises.push(client.getEntries({content_type: 'blogPost', include: 5, limit: 1000, order: '-fields.date'}));

    return Promise.all(promises)
        .spread((cmsBlog, cmsBlogPosts)=> {
            blog = get(cmsBlog.toPlainObject(), 'items[0].fields', {});
            //cache.set('blog', blog);

            blogPosts = postProcessBlogPost(cmsBlogPosts);
            //cache.set('blogPosts', blogPosts);

            if (req.isServerRequest) {
                req.dependentData = ['blog', 'blogPosts'];
                req.dependentEntries = [{blog}, {blogPosts}];
                return next();
            } else {
                return res.json({
                    blog,
                    blogPosts
                })
            }
        })
        .catch(err=>next(err));
}
