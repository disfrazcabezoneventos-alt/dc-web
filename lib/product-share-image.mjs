/** Fit Cloudinary originals into social cards without cropping or upscaling the photo.
 * @param {string} image
 * @param {string} siteUrl
 * @returns {{url:string,width?:number,height?:number}|null}
 */
export function productShareImage(image,siteUrl){
 if(!image)return null;
 const url=new URL(image,siteUrl).href;
 // Preserve custom/transformed/signed URLs; originals have an explicit version segment.
 const parsed=new URL(url),parts=parsed.pathname.split('/');
 if(parsed.hostname==='res.cloudinary.com'&&parsed.protocol==='https:'&&parts[2]==='image'&&parts[3]==='upload'&&/^v[0-9]+$/.test(parts[4]))return {url:url.replace('/image/upload/','/image/upload/c_lpad,w_1200,h_630,b_white,f_jpg,q_auto/'),width:1200,height:630};
 return {url};
}
