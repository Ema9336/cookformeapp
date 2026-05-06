export type CartItem = {
  chefSlug: string;
  chefName: string;
  itemName: string;
  qty: number;
  price?: string;
};

const CART_STORAGE_KEY = 'cookforme_cart_v1';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getCartItems(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => item as CartItem)
      .filter((item) => item.chefSlug && item.itemName && Number.isFinite(item.qty) && item.qty > 0);
  } catch {
    return [];
  }
}

export function setCartItems(items: CartItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function clearCart() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
}

export function addToCart(item: Omit<CartItem, 'qty'> & { qty?: number }) {
  const qty = item.qty ?? 1;
  const existing = getCartItems();
  const index = existing.findIndex((it) => it.chefSlug === item.chefSlug && it.itemName === item.itemName);

  if (index >= 0) {
    existing[index] = {
      ...existing[index],
      qty: existing[index].qty + qty,
      price: item.price ?? existing[index].price,
      chefName: item.chefName || existing[index].chefName,
    };
  } else {
    existing.push({
      chefSlug: item.chefSlug,
      chefName: item.chefName,
      itemName: item.itemName,
      price: item.price,
      qty,
    });
  }

  setCartItems(existing);
  return existing;
}

export function getCartTotalQty(items?: CartItem[]): number {
  const source = items ?? getCartItems();
  return source.reduce((sum, item) => sum + item.qty, 0);
}
