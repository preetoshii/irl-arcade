export const validatePlayerName = (name) => {
  const trimmed = name.trim();
  return {
    isValid: trimmed.length > 0 && trimmed.length <= 20,
    cleaned: trimmed
  };
};

export const getUniquePlayerName = (name, existingNames) => {
  let uniqueName = name;
  let counter = 2;
  
  while (existingNames.includes(uniqueName)) {
    uniqueName = `${name} ${counter}`;
    counter++;
  }
  
  return uniqueName;
};

export const formatPlayerName = (name) => {
  return name.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};