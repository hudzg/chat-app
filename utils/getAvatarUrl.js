import isValidUrl from './checkValidUrl';

export default getAvatarUrl = (url) => {
    if ( isValidUrl(url)) return url;
    
    return 'https://cdn-icons-png.flaticon.com/512/9131/9131478.png';
}