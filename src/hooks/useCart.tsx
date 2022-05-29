import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get<Product>(`/products/${productId}`);
      const productData = response.data;

      const stockResponse = await api.get<Stock>(`/stock/${productId}`);
      const productStock = stockResponse.data;

      setCart((currentCart) => {
        const findProduct = currentCart.find(
          (product) => product.id === productId
        );
        var cartData = [] as Product[];

        if (findProduct) {
          const productAmount = findProduct.amount + 1;

          if (productAmount <= productStock.amount) {
            const data = { ...findProduct, amount: findProduct.amount + 1 };

            const filteredCartProduct = currentCart.filter(
              (product) => product.id !== productId
            );

            cartData = [...filteredCartProduct, data];
          } else {
            toast.error("Quantidade solicitada fora de estoque");
            cartData = [...currentCart];
          }
        } else {
          cartData = [...currentCart, { ...productData, amount: 1 }];
        }

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartData));

        return cartData;
      });
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart((currentCart) => {
        const cartDataUpdated = currentCart.filter(
          (cartItem) => cartItem.id !== productId
        );

        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(cartDataUpdated)
        );

        return cartDataUpdated;
      });
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get<Product>(`/products/${productId}`);
      const productData = response.data;

      const stockResponse = await api.get<Stock>(`/stock/${productId}`);
      const productStock = stockResponse.data;

      setCart((currentCart) => {
        const findProduct = currentCart.find(
          (product) => product.id === productId
        );

        if (findProduct) {
          const productAmount = findProduct.amount + amount;

          if (productAmount <= productStock.amount) {
            const productDataUpdated = {
              ...productData,
              amount: productAmount,
            };

            const filteredCartProduct = currentCart.filter(
              (product) => product.id !== productId
            );

            return [...filteredCartProduct, productDataUpdated];
          } else {
            toast.error("Quantidade solicitada fora de estoque");
          }
        }

        return [...currentCart];
      });
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
