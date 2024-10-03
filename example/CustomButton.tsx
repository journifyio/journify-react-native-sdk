import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomButton = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007bff', // Button background color
    paddingVertical: 12,        // Vertical padding
    paddingHorizontal: 25,      // Horizontal padding
    borderRadius: 8,            // Rounded corners
    alignItems: 'center',       // Center the text horizontally
    marginTop: 10,              // Add margin for spacing
  },
  buttonText: {
    color: '#fff',              // Text color
    fontSize: 16,               // Text size
    fontWeight: '600',          // Text weight
  },
});

export default CustomButton;
