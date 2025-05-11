const isValidUrl = (url) => {
    const regex = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;
    return regex.test(url);
  };

export default isValidUrl;