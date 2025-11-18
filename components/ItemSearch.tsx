import { compatibilityApi, SearchItem } from '@/services/compatibility';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface ItemSearchProps {
  onSelectItem: (item: SearchItem) => void;
  placeholder?: string;
  excludeItemId?: string;
}

export function ItemSearch({ onSelectItem, placeholder = 'Search for an item...', excludeItemId }: ItemSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const items = await compatibilityApi.searchItems(query);
          // Exclude selected item from results
          const filtered = excludeItemId 
            ? items.filter((item: SearchItem) => item.id !== excludeItemId)
            : items;
          setResults(filtered);
          setShowResults(true);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, excludeItemId]);

  const handleSelectItem = (item: SearchItem) => {
    setQuery(`${item.manufacturer} - ${item.name} (${item.reference})`);
    setShowResults(false);
    onSelectItem(item);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}

      {showResults && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelectItem(item)}
            >
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultDetails}>
                {item.manufacturer} • {item.reference} • {item.type === 'weapon' ? 'Weapon' : 'Part'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {showResults && results.length === 0 && !loading && query.length >= 2 && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>Aucun équipement trouvé</Text>
          <Text style={styles.noResultsHint}>
            Essayez de chercher par: {'\n'}
            • Marque (ex: "Tokyo Marui", "Krytac"){'\n'}
            • Modèle (ex: "M4A1", "AK47"){'\n'}
            • Type de pièce (ex: "Magazine", "Barrel")
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    position: 'absolute',
    right: 16,
    top: 15,
  },
  resultsList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#fff',
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: '#666',
  },
  noResults: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#fff',
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  noResultsHint: {
    fontSize: 11,
    color: '#666',
    lineHeight: 18,
    textAlign: 'left',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});
