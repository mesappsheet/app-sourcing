import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  loadAllProductsFromDb, 
  saveProductToDb, 
  deleteProductFromDb, 
  updateProductCategoryInDb 
} from '../utils/dbStorage';

export const PRODUCTS_QUERY_KEY = 'products';

/**
 * 📦 Hook Centralisé React Query pour la gestion des articles par Espace de Sourcing
 * Assure la source de vérité unique, l'invalidation automatique et la déduplication.
 */
export function useProducts(workspaceId = 'ws_quincaillerie') {
  const queryClient = useQueryClient();

  // 1. Lecture avec cache unifié et revalidation
  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, workspaceId],
    queryFn: () => loadAllProductsFromDb(workspaceId),
    staleTime: 1000 * 60 * 2, // 2 minutes de fraîcheur
    refetchOnWindowFocus: true
  });

  // 2. Mutation : Sauvegarde / Insertion (Upsert)
  const saveMutation = useMutation({
    mutationFn: (product) => saveProductToDb(product, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY, workspaceId] });
    }
  });

  // 3. Mutation : Suppression d'un article
  const deleteMutation = useMutation({
    mutationFn: (productId) => deleteProductFromDb(productId, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY, workspaceId] });
    }
  });

  // 4. Mutation : Changement de Rayon / Sous-catégorie
  const moveCategoryMutation = useMutation({
    mutationFn: ({ productId, newCategory }) => updateProductCategoryInDb(productId, newCategory, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY, workspaceId] });
    }
  });

  return {
    products,
    isLoading,
    isError,
    error,
    refetch,
    saveProduct: saveMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    moveProductCategory: moveCategoryMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}