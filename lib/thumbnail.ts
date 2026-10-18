/** A small Cloudinary variant for older products that predate stored thumbnails. */
export function thumbnailUrl(image:string, thumbnail?:string):string {
 if(thumbnail)return thumbnail;
 if(!image.startsWith('https://res.cloudinary.com/'))return image;
 const marker='/image/upload/';
 const index=image.indexOf(marker);
 if(index<0)return image;
 return image.slice(0,index+marker.length)+'c_limit,h_160,w_160/'+image.slice(index+marker.length);
}
