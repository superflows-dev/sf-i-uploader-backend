export const getMimeFromExtension = (ext) => {
  
    var retVal = '';
    
    if(ext == "png") {
        retVal = 'image/png'
    }
    
    if(ext == "jpg") {
        retVal = 'image/jpg'
    }

    
    return retVal;
  
}