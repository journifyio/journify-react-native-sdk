import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createClient } from '@journifyio/react-native-sdk';
import { IdfaPlugin } from '@journifyio/react-native-sdk-plugin-idfa';
import { AdvertisingIdPlugin } from '@journifyio/react-native-sdk-plugin-advertising-id'

const client = createClient({
  writeKey: 'wk_2d4mVF4PZNzNfGzfiLdaMkw9rVf',
})

client.add({ plugin: new IdfaPlugin() });
client.add({ plugin: new AdvertisingIdPlugin() });

// Types
type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
};

type RootStackParamList = {
  Home: undefined;
  ProductDetail: { product: Product };
};

type BottomTabParamList = {
  Shoes: undefined;
  Apparel: undefined;
};

// Mock data
const shoesData: Product[] = [
  { id: '1', name: 'Running Shoe 1', price: 99.99, image: 'https://via.assets.so/shoe.png?id=1&q=95', description: 'Comfortable running shoe with great support.' },
  { id: '2', name: 'Running Shoe 2', price: 129.99, image: 'https://via.assets.so/shoe.png?id=2&q=95', description: 'Lightweight and breathable running shoe.' },
];

const apparelData: Product[] = [
  { id: '3', name: 'T-Shirt', price: 29.99, image: 'https://via.assets.so/shoe.png?id=3&q=95', description: 'Moisture-wicking running shirt.' },
  { id: '4', name: 'Shorts', price: 39.99, image: 'https://via.assets.so/shoe.png?id=4&q=95', description: 'Comfortable running shorts with built-in liner.' },
];

// Components
const ProductItem: React.FC<{ item: Product; onPress: () => void; onAddToCart: () => void }> = ({ item, onPress, onAddToCart }) => (
  <View style={styles.productItem}>
    <Image source={{ uri: item.image }} style={styles.productImage} />
    <Text style={styles.productName}>{item.name}</Text>
    <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>View</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onAddToCart}>
        <Text style={styles.buttonText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ProductListScreen: React.FC<{ products: Product[], navigation: any }> = ({ products, navigation }) => {
  const handleAddToCart = (product: Product) => {
    client.track('add_to_cart', {
      product: product.name,
      price: product.price,
    });
  };

  return (
    <FlatList
      data={products}
      renderItem={({ item }) => (
        <ProductItem
          item={item}
          onPress={() => navigation.navigate('ProductDetail', { product: item })}
          onAddToCart={() => handleAddToCart(item)}
        />
      )}
      keyExtractor={(item) => item.id}
    />
  );
};

const ProductDetailScreen: React.FC<{ route: any }> = ({ route }) => {
  const { product } = route.params;

  const handleAddToCart = () => {
    client.track('add_to_cart', {
      product: product.name,
      price: product.price,
    });
  };

  const handlePurchase = () => {
    client.track('purchase', {
      product: product.name,
      price: product.price,
    });
  };

  return (
    <View style={styles.productDetailContainer}>
      <Image source={{ uri: product.image }} style={styles.productDetailImage} />
      <Text style={styles.productDetailName}>{product.name}</Text>
      <Text style={styles.productDetailPrice}>${product.price.toFixed(2)}</Text>
      <Text style={styles.productDetailDescription}>{product.description}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleAddToCart}>
          <Text style={styles.buttonText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handlePurchase}>
          <Text style={styles.buttonText}>Purchase</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const ShoesScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <ProductListScreen products={shoesData} navigation={navigation} />
);

const ApparelScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <ProductListScreen products={apparelData} navigation={navigation} />
);

const HomeStack: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
  </Stack.Navigator>
);

const HomeTabs: React.FC = () => (
  <Tab.Navigator>
    <Tab.Screen name="Shoes" component={ShoesScreen} />
    <Tab.Screen name="Apparel" component={ApparelScreen} />
  </Tab.Navigator>
);

const App: React.FC = () => (
  <NavigationContainer>
    <HomeStack />
  </NavigationContainer>
);

const styles = StyleSheet.create({
  productItem: {
    padding: 10,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
  productDetailContainer: {
    padding: 16,
  },
  productDetailImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  productDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  productDetailPrice: {
    fontSize: 20,
    color: '#888',
    marginTop: 8,
  },
  productDetailDescription: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
});

export default App;