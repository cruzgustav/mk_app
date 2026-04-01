'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Trash2,
  Settings,
  Download,
  Upload,
  RotateCcw,
  LogOut,
  Package,
  Palette,
  Layers,
  Droplets,
  Circle,
  Sparkles,
  Heart,
  Sun,
  Wind,
  Star,
  Brush,
  Wand2,
  AlertTriangle,
  Loader2,
  Save,
  Database,
  ShieldCheck,
  ExternalLink,
  ImagePlus,
  ImageIcon,
  Check,
  ShoppingBag,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useToast } from '@/hooks/use-toast';
import {
  loadCatalog,
  saveCatalog,
  addCategory,
  updateCategory,
  deleteCategory,
  addSkinTone,
  updateSkinTone,
  deleteSkinTone,
  addProduct,
  updateProduct,
  deleteProduct,
  toggleProductSkinTone,
  getCategoryName,
  getProductCountForSkinTone,
  getProduct,
  exportCatalog,
  importCatalog,
  resetCatalog,
  verifyPassword,
  updateSettings,
  type Catalog,
  type Category,
  type SkinTone,
  type Product,
} from '@/lib/catalog';

// ---- Icon Map ----

const ICON_OPTIONS = [
  { value: 'droplets', label: 'Droplets' },
  { value: 'circle', label: 'Circle' },
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'heart', label: 'Heart' },
  { value: 'sun', label: 'Sun' },
  { value: 'layers', label: 'Layers' },
  { value: 'palette', label: 'Palette' },
  { value: 'wind', label: 'Wind' },
  { value: 'package', label: 'Package' },
  { value: 'star', label: 'Star' },
  { value: 'brush', label: 'Brush' },
  { value: 'wand-2', label: 'Wand' },
] as const;

function getIconComponent(iconName: string, size = 18) {
  const props = { size, className: 'text-slate-500' };
  switch (iconName) {
    case 'droplets': return <Droplets {...props} />;
    case 'circle': return <Circle {...props} />;
    case 'sparkles': return <Sparkles {...props} />;
    case 'heart': return <Heart {...props} />;
    case 'sun': return <Sun {...props} />;
    case 'layers': return <Layers {...props} />;
    case 'palette': return <Palette {...props} />;
    case 'wind': return <Wind {...props} />;
    case 'package': return <Package {...props} />;
    case 'star': return <Star {...props} />;
    case 'brush': return <Brush {...props} />;
    case 'wand-2': return <Wand2 {...props} />;
    default: return <Package {...props} />;
  }
}

// ---- Labels ----

const undertoneLabel: Record<string, string> = {
  Warm: 'Quente',
  Cool: 'Frio',
  Neutral: 'Neutro',
};

const depthLabel: Record<string, string> = {
  Fair: 'Muito Claro',
  Light: 'Claro',
  Medium: 'Médio',
  Tan: 'Bronzeado',
  Deep: 'Escuro',
};

// ---- Component ----

export default function AdminPanel() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productImageRef = useRef<HTMLInputElement>(null);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Catalog state
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(false);

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('package');

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'skinTone' | 'product'; id: string; name: string } | null>(null);

  // SkinTone dialog state
  const [skinToneDialogOpen, setSkinToneDialogOpen] = useState(false);
  const [editingSkinTone, setEditingSkinTone] = useState<SkinTone | null>(null);
  const [stColorName, setStColorName] = useState('');
  const [stUndertone, setStUndertone] = useState<'Warm' | 'Cool' | 'Neutral'>('Warm');
  const [stDepth, setStDepth] = useState<'Fair' | 'Light' | 'Medium' | 'Tan' | 'Deep'>('Fair');
  const [stColorHex, setStColorHex] = useState('#E8BEAC');
  const [stDescription, setStDescription] = useState('');
  const [stTips, setStTips] = useState<string[]>([]);

  // Settings state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayLimit, setDisplayLimit] = useState(6);

  // Reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Products tab state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', category: '', link: '', image: '', skinToneIds: [] as string[] });

  // ---- Load Catalog ----

  useEffect(() => {
    loadCatalogData();
  }, []);

  const loadCatalogData = async () => {
    setLoading(true);
    try {
      const data = await loadCatalog();
      setCatalog(data);
      setDisplayLimit(data.settings.displayLimit || 6);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar catálogo.';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ---- Persist Helper (async) ----

  const persist = useCallback(async (updated: Catalog) => {
    setCatalog(updated);
    try {
      await saveCatalog(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar.';
      toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' });
    }
  }, [toast]);

  // ---- Login Handler ----

  const handleLogin = () => {
    if (!catalog) return;
    if (verifyPassword(catalog, passwordInput)) {
      setIsAuthenticated(true);
      setLoginError('');
      setPasswordInput('');
      toast({ title: 'Bem-vindo!', description: 'Painel administrativo acessado.' });
    } else {
      setLoginError('Senha incorreta. Tente novamente.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  // ---- Category CRUD ----

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatIcon('package');
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (!catalog || !catName.trim()) return;
    let updated: Catalog;
    if (editingCategory) {
      updated = updateCategory(catalog, editingCategory.id, { name: catName.trim(), icon: catIcon });
      toast({ title: 'Categoria atualizada', description: `"${catName.trim()}" foi salva.` });
    } else {
      updated = addCategory(catalog, { name: catName.trim(), icon: catIcon });
      toast({ title: 'Categoria criada', description: `"${catName.trim()}" foi adicionada.` });
    }
    persist(updated);
    setCategoryDialogOpen(false);
  };

  const handleDeleteCategory = () => {
    if (!catalog || !deleteTarget || deleteTarget.type !== 'category') return;
    const updated = deleteCategory(catalog, deleteTarget.id);
    persist(updated);
    setDeleteTarget(null);
    toast({ title: 'Categoria excluída', description: `"${deleteTarget.name}" foi removida.` });
  };

  // ---- SkinTone CRUD ----

  const openAddSkinTone = () => {
    setEditingSkinTone(null);
    setStColorName('');
    setStUndertone('Warm');
    setStDepth('Fair');
    setStColorHex('#E8BEAC');
    setStDescription('');
    setStTips([]);
    setSkinToneDialogOpen(true);
  };

  const openEditSkinTone = (tone: SkinTone) => {
    setEditingSkinTone(tone);
    setStColorName(tone.colorName);
    setStUndertone(tone.undertone);
    setStDepth(tone.depth);
    setStColorHex(tone.colorHex);
    setStDescription(tone.description || '');
    setStTips(tone.tips || []);
    setSkinToneDialogOpen(true);
  };

  const handleSaveSkinTone = () => {
    if (!catalog || !stColorName.trim()) return;
    let updated: Catalog;
    if (editingSkinTone) {
      updated = updateSkinTone(catalog, editingSkinTone.id, {
        colorName: stColorName.trim(),
        undertone: stUndertone,
        depth: stDepth,
        colorHex: stColorHex,
        description: stDescription.trim() || undefined,
        tips: stTips.length ? stTips : undefined,
      });
      toast({ title: 'Tom atualizado', description: `"${stColorName.trim()}" foi salvo.` });
    } else {
      updated = addSkinTone(catalog, {
        colorName: stColorName.trim(),
        undertone: stUndertone,
        depth: stDepth,
        colorHex: stColorHex,
        description: stDescription.trim() || undefined,
        tips: stTips.length ? stTips : undefined,
      });
      toast({ title: 'Tom criado', description: `"${stColorName.trim()}" foi adicionado.` });
    }
    persist(updated);
    setSkinToneDialogOpen(false);
  };

  const handleDeleteSkinTone = () => {
    if (!catalog || !deleteTarget || deleteTarget.type !== 'skinTone') return;
    const updated = deleteSkinTone(catalog, deleteTarget.id);
    persist(updated);
    setDeleteTarget(null);
    toast({ title: 'Tom excluído', description: `"${deleteTarget.name}" foi removido.` });
  };

  // ---- Product CRUD ----

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: '', category: catalog?.categories[0]?.id || '', link: '', image: '', skinToneIds: [] });
    setProductDialogOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      link: product.link,
      image: product.image,
      skinToneIds: [...product.skinToneIds],
    });
    setProductDialogOpen(true);
  };

  const handleToggleProductSkinTone = (skinToneId: string) => {
    if (!editingProduct || !catalog) return;
    const updated = toggleProductSkinTone(catalog, editingProduct.id, skinToneId);
    setCatalog(updated);
    // Update form state
    const has = productForm.skinToneIds.includes(skinToneId);
    setProductForm(prev => ({
      ...prev,
      skinToneIds: has
        ? prev.skinToneIds.filter(id => id !== skinToneId)
        : [...prev.skinToneIds, skinToneId],
    }));
    // Persist
    saveCatalog(updated).catch(() => {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    });
  };

  const handleToggleNewProductSkinTone = (skinToneId: string) => {
    const has = productForm.skinToneIds.includes(skinToneId);
    setProductForm(prev => ({
      ...prev,
      skinToneIds: has
        ? prev.skinToneIds.filter(id => id !== skinToneId)
        : [...prev.skinToneIds, skinToneId],
    }));
  };

  const handleSaveProduct = () => {
    if (!catalog || !productForm.name.trim()) return;
    let updated: Catalog;
    if (editingProduct) {
      updated = updateProduct(catalog, editingProduct.id, {
        name: productForm.name.trim(),
        category: productForm.category,
        link: productForm.link,
        image: productForm.image,
        skinToneIds: productForm.skinToneIds,
      });
      toast({ title: 'Produto atualizado!', description: `"${productForm.name.trim()}" foi salvo.` });
    } else {
      updated = addProduct(catalog, {
        name: productForm.name.trim(),
        category: productForm.category,
        link: productForm.link,
        image: productForm.image,
        skinToneIds: productForm.skinToneIds,
      });
      toast({ title: 'Produto adicionado!', description: `"${productForm.name.trim()}" foi criado.` });
    }
    persist(updated);
    setProductDialogOpen(false);
  };

  const handleDeleteProduct = () => {
    if (!catalog || !deleteTarget?.id) return;
    const updated = deleteProduct(catalog, deleteTarget.id);
    persist(updated);
    setDeleteTarget(null);
    toast({ title: 'Produto excluído', description: `"${deleteTarget.name}" foi removido.`, variant: 'destructive' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande!', description: 'Tamanho máximo: 2MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProductForm(prev => ({ ...prev, image: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
    if (productImageRef.current) productImageRef.current.value = '';
  };

  // ---- Settings ----

  const handleChangePassword = () => {
    if (!catalog) return;
    if (!newPassword.trim()) {
      toast({ title: 'Erro', description: 'Digite a nova senha.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    const updated = updateSettings(catalog, { password: newPassword.trim() });
    persist(updated);
    setNewPassword('');
    setConfirmPassword('');
    toast({ title: 'Senha alterada', description: 'A senha foi atualizada com sucesso.' });
  };

  const handleSaveDisplayLimit = () => {
    if (!catalog) return;
    const updated = updateSettings(catalog, { displayLimit });
    persist(updated);
    toast({ title: 'Configurações salvas', description: `Limite de exibição: ${displayLimit} produtos.` });
  };

  // ---- Data Operations ----

  const handleExport = () => {
    if (!catalog) return;
    exportCatalog(catalog);
    toast({ title: 'Exportado', description: 'Arquivo JSON baixado com sucesso.' });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importCatalog(file);
      setCatalog(imported);
      await saveCatalog(imported);
      setDisplayLimit(imported.settings.displayLimit || 6);
      toast({ title: 'Importado', description: 'Catálogo importado com sucesso.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao importar.';
      toast({ title: 'Erro na importação', description: message, variant: 'destructive' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = async () => {
    try {
      const fresh = await resetCatalog();
      setCatalog(fresh);
      setDisplayLimit(fresh.settings.displayLimit || 6);
      setResetDialogOpen(false);
      toast({ title: 'Resetado', description: 'Catálogo restaurado para os dados originais.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao resetar.';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    }
  };

  // ---- Render: Login ----

  if (!isAuthenticated || !catalog) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <Card className="w-full max-w-sm shadow-xl border-slate-200">
            <CardHeader className="text-center space-y-3 pb-2">
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.1 }}
                className="mx-auto w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center"
              >
                <Shield className="size-8 text-rose-500" />
              </motion.div>
              <CardTitle className="text-xl font-semibold text-slate-800">
                Painel Administrativo
              </CardTitle>
              <CardDescription className="text-slate-500">
                Digite a senha para acessar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-6 animate-spin text-rose-500" />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Senha"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setLoginError('');
                      }}
                      onKeyDown={handleKeyDown}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {loginError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-sm text-red-500 flex items-center gap-1"
                      >
                        <AlertTriangle className="size-3.5" />
                        {loginError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <Button
                    onClick={handleLogin}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                  >
                    Entrar
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // ---- Render: Main Panel ----

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ---- Header ---- */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg shrink-0"
      >
        <div className="flex items-center gap-3">
          <Shield className="size-5 text-rose-400" />
          <h1 className="text-lg font-semibold">Painel Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAuthenticated(false);
              setPasswordInput('');
              setLoginError('');
            }}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="size-4 mr-1.5" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </motion.header>

      {/* ---- Content ---- */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto w-full p-4 sm:p-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs defaultValue="categorias" className="w-full">
              {/* ---- Tab Navigation ---- */}
              <TabsList className="w-full grid grid-cols-5 mb-6 bg-white border border-slate-200 rounded-lg p-1 h-auto">
                <TabsTrigger
                  value="categorias"
                  className="rounded-md py-2.5 text-xs sm:text-sm gap-1.5 data-[state=active]:bg-rose-500 data-[state=active]:text-white"
                >
                  <Layers className="size-3.5 sm:size-4" />
                  <span className="hidden xs:inline">Categorias</span>
                  <span className="xs:hidden">Cat.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="tons"
                  className="rounded-md py-2.5 text-xs sm:text-sm gap-1.5 data-[state=active]:bg-rose-500 data-[state=active]:text-white"
                >
                  <Palette className="size-3.5 sm:size-4" />
                  <span className="hidden xs:inline">Tons de Pele</span>
                  <span className="xs:hidden">Tons</span>
                </TabsTrigger>
                <TabsTrigger
                  value="produtos"
                  className="rounded-md py-2.5 text-xs sm:text-sm gap-1.5 data-[state=active]:bg-rose-500 data-[state=active]:text-white"
                >
                  <Package className="size-3.5 sm:size-4" />
                  <span className="hidden sm:inline">Produtos</span>
                  <span className="sm:hidden">Prod.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="config"
                  className="rounded-md py-2.5 text-xs sm:text-sm gap-1.5 data-[state=active]:bg-rose-500 data-[state=active]:text-white"
                >
                  <Settings className="size-3.5 sm:size-4" />
                  <span className="hidden sm:inline">Configurações</span>
                  <span className="sm:hidden">Config</span>
                </TabsTrigger>
                <TabsTrigger
                  value="dados"
                  className="rounded-md py-2.5 text-xs sm:text-sm gap-1.5 data-[state=active]:bg-rose-500 data-[state=active]:text-white"
                >
                  <Database className="size-3.5 sm:size-4" />
                  <span className="hidden sm:inline">Dados</span>
                  <span className="sm:hidden">Dados</span>
                </TabsTrigger>
              </TabsList>

              {/* ========================================= */}
              {/* TAB: CATEGORIAS                            */}
              {/* ========================================= */}
              <TabsContent value="categorias">
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Categorias de Produtos</CardTitle>
                        <CardDescription>
                          {catalog.categories.length} categoria{catalog.categories.length !== 1 ? 's' : ''} cadastrada{catalog.categories.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      <Button onClick={openAddCategory} size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
                        <Plus className="size-4 mr-1.5" />
                        Nova Categoria
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {catalog.categories.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                        <Package className="size-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Nenhuma categoria cadastrada.</p>
                        <p className="text-xs mt-1">Clique em &quot;Nova Categoria&quot; para começar.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                        {catalog.categories.map((cat) => (
                          <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                                {getIconComponent(cat.icon, 18)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-slate-800 truncate">{cat.name}</p>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                  {cat.icon}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditCategory(cat)}
                                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })}
                                className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ========================================= */}
              {/* TAB: TONS DE PELE                          */}
              {/* ========================================= */}
              <TabsContent value="tons">
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Tons de Pele</CardTitle>
                        <CardDescription>
                          {catalog.skinTones.length} tom{catalog.skinTones.length !== 1 ? 's' : ''} cadastrado{catalog.skinTones.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      <Button onClick={openAddSkinTone} size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
                        <Plus className="size-4 mr-1.5" />
                        Novo Tom
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {catalog.skinTones.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                        <Palette className="size-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Nenhum tom de pele cadastrado.</p>
                        <p className="text-xs mt-1">Clique em &quot;Novo Tom&quot; para começar.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[520px] overflow-y-auto pr-1">
                        {catalog.skinTones.map((tone) => {
                          const prodCount = getProductCountForSkinTone(catalog, tone.id);
                          return (
                            <motion.div
                              key={tone.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className="w-10 h-10 rounded-full border-2 border-white shadow-md shrink-0"
                                  style={{ backgroundColor: tone.colorHex }}
                                />
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-slate-800 truncate">{tone.colorName}</p>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                                      {undertoneLabel[tone.undertone] || tone.undertone}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                                      {depthLabel[tone.depth] || tone.depth}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal bg-rose-50 text-rose-600">
                                      {prodCount} prod.
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditSkinTone(tone)}
                                  className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteTarget({ type: 'skinTone', id: tone.id, name: tone.colorName })}
                                  className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ========================================= */}
              {/* TAB: PRODUTOS (NEW GLOBAL MODEL)           */}
              {/* ========================================= */}
              <TabsContent value="produtos">
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <ShoppingBag className="size-4 text-rose-500" />
                          Produtos
                        </CardTitle>
                        <CardDescription>
                          {catalog.products.length} produto{catalog.products.length !== 1 ? 's' : ''} cadastrado{catalog.products.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      <Button onClick={openAddProduct} size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
                        <Plus className="size-4 mr-1.5" />
                        Novo Produto
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {catalog.products.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                        <ImageIcon className="size-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Nenhum produto cadastrado.</p>
                        <p className="text-xs mt-1">Clique em &quot;Novo Produto&quot; para começar.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                        {catalog.products.map((product) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                                  <Package className="size-5 text-rose-300" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-slate-800 truncate">{product.name}</p>
                                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                  <Badge className="text-[10px] px-1.5 py-0 h-4 font-normal bg-rose-100 text-rose-700 hover:bg-rose-100 border-0">
                                    {getCategoryName(catalog, product.category)}
                                  </Badge>
                                  {/* Skin tone dots */}
                                  <div className="flex items-center gap-0.5">
                                    {catalog.skinTones.map((tone) => {
                                      const isLinked = product.skinToneIds.includes(tone.id);
                                      return (
                                        <div
                                          key={tone.id}
                                          title={tone.colorName}
                                          className="w-3.5 h-3.5 rounded-full border transition-all"
                                          style={{
                                            backgroundColor: isLinked ? tone.colorHex : 'transparent',
                                            borderColor: isLinked ? tone.colorHex : '#cbd5e1',
                                            opacity: isLinked ? 1 : 0.4,
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {product.skinToneIds.length} tom{product.skinToneIds.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditProduct(product)}
                                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget({ type: 'product', id: product.id, name: product.name })}
                                className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ========================================= */}
              {/* TAB: CONFIGURAÇÕES                         */}
              {/* ========================================= */}
              <TabsContent value="config">
                <div className="space-y-6">
                  {/* Password Card */}
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lock className="size-4 text-rose-500" />
                        Alterar Senha
                      </CardTitle>
                      <CardDescription>
                        Atualize a senha de acesso ao painel administrativo
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs text-slate-500">Senha Atual</Label>
                        <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-md border border-slate-200 bg-slate-50">
                          <Lock className="size-3.5 text-slate-400" />
                          <span className="text-sm text-slate-600 tracking-widest">{'•'.repeat(8)}</span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="new-password" className="text-xs text-slate-500">Nova Senha</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Digite a nova senha"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password" className="text-xs text-slate-500">Confirmar Senha</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirme a nova senha"
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={handleChangePassword}
                        className="bg-rose-500 hover:bg-rose-600 text-white"
                      >
                        <ShieldCheck className="size-4 mr-1.5" />
                        Alterar Senha
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Display Limit Card */}
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="size-4 text-rose-500" />
                        Limite de Exibição
                      </CardTitle>
                      <CardDescription>
                        Número máximo de produtos exibidos por tom de pele
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-slate-600">Produtos por tom</Label>
                        <span className="text-2xl font-bold text-rose-500">{displayLimit}</span>
                      </div>
                      <Slider
                        value={[displayLimit]}
                        onValueChange={(val) => setDisplayLimit(val[0])}
                        min={1}
                        max={20}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>1</span>
                        <span>20</span>
                      </div>
                      <Button
                        onClick={handleSaveDisplayLimit}
                        variant="outline"
                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                      >
                        <Save className="size-4 mr-1.5" />
                        Salvar Configurações
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ========================================= */}
              {/* TAB: DADOS                                 */}
              {/* ========================================= */}
              <TabsContent value="dados">
                <div className="space-y-6">
                  {/* Info Card */}
                  <Card className="border-slate-200 bg-emerald-50/50">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <Database className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-emerald-800">Armazenamento no Projeto</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            Os dados são salvos diretamente no arquivo <code className="bg-emerald-100 px-1 rounded">catalog.json</code> do projeto.
                            Tudo persiste automaticamente — nenhum dado se perde ao limpar o navegador.
                            Use Exportar para baixar uma cópia de backup.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Export Card */}
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Download className="size-4 text-emerald-500" />
                        Exportar Catálogo
                      </CardTitle>
                      <CardDescription>
                        Baixe uma cópia de backup do catálogo completo em JSON
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleExport}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <Download className="size-4 mr-1.5" />
                        Exportar JSON
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Import Card */}
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Upload className="size-4 text-blue-500" />
                        Importar Catálogo
                      </CardTitle>
                      <CardDescription>
                        Restaure o catálogo a partir de um arquivo JSON exportado anteriormente
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-amber-600 flex items-center gap-1.5">
                        <AlertTriangle className="size-3.5" />
                        A importação substituirá todos os dados atuais.
                      </p>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          className="hidden"
                          id="import-catalog"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Upload className="size-4 mr-1.5" />
                          Selecionar Arquivo JSON
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reset Card */}
                  <Card className="border-red-200 bg-red-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-red-700">
                        <RotateCcw className="size-4" />
                        Zona de Perigo
                      </CardTitle>
                      <CardDescription className="text-red-600/80">
                        Restaure o catálogo para os dados originais do sistema.
                        Todas as alterações serão perdidas.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-100">
                            <RotateCcw className="size-4 mr-1.5" />
                            Resetar para dados originais
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
                              <AlertTriangle className="size-5" />
                              Confirmar Reset
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600">
                              Esta ação não pode ser desfeita. O catálogo será restaurado para os dados originais
                              e todas as suas alterações serão permanentemente perdidas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-slate-300">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleReset}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Sim, resetar tudo
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* ---- Category Dialog ---- */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Altere os dados da categoria abaixo.'
                : 'Preencha os dados da nova categoria.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nome da Categoria</Label>
              <Input
                id="cat-name"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Ex: Base, Pó, Blush..."
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Select value={catIcon} onValueChange={setCatIcon}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        {getIconComponent(opt.value, 16)}
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={!catName.trim()}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- SkinTone Dialog ---- */}
      <Dialog open={skinToneDialogOpen} onOpenChange={setSkinToneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSkinTone ? 'Editar Tom de Pele' : 'Novo Tom de Pele'}
            </DialogTitle>
            <DialogDescription>
              {editingSkinTone
                ? 'Altere os dados do tom de pele abaixo.'
                : 'Preencha os dados do novo tom de pele.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="st-name">Nome da Cor</Label>
              <Input
                id="st-name"
                value={stColorName}
                onChange={(e) => setStColorName(e.target.value)}
                placeholder="Ex: Bege Rosado, Dourado Médio..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subtom</Label>
                <Select
                  value={stUndertone}
                  onValueChange={(v) => setStUndertone(v as 'Warm' | 'Cool' | 'Neutral')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Subtom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Warm">Quente (Warm)</SelectItem>
                    <SelectItem value="Cool">Frio (Cool)</SelectItem>
                    <SelectItem value="Neutral">Neutro (Neutral)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profundidade</Label>
                <Select
                  value={stDepth}
                  onValueChange={(v) => setStDepth(v as 'Fair' | 'Light' | 'Medium' | 'Tan' | 'Deep')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Profundidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fair">Muito Claro (Fair)</SelectItem>
                    <SelectItem value="Light">Claro (Light)</SelectItem>
                    <SelectItem value="Medium">Médio (Medium)</SelectItem>
                    <SelectItem value="Tan">Bronzeado (Tan)</SelectItem>
                    <SelectItem value="Deep">Escuro (Deep)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor (Hex)</Label>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-slate-200 shadow-inner shrink-0"
                  style={{ backgroundColor: stColorHex }}
                />
                <Input
                  type="color"
                  value={stColorHex}
                  onChange={(e) => setStColorHex(e.target.value)}
                  className="w-full h-10 p-1 cursor-pointer"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Descrição do Tom (aparece no resultado)</Label>
              <textarea
                className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                rows={3}
                placeholder="Ex: Uma base clara com subtons dourados, perfeita para peles..."
                value={stDescription}
                onChange={(e) => setStDescription(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Dicas de Aplicação (uma por linha)</Label>
              <textarea
                className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent font-mono"
                rows={4}
                placeholder={"Hidrate bem a pele antes da aplicação.\nUse uma esponja úmida.\nAplique do centro para fora."}
                value={stTips.join('\n')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n').filter(l => l.trim());
                  setStTips(lines);
                }}
              />
              <p className="text-[10px] text-slate-400 mt-1">Uma dica por linha. Essas dicas aparecem no resultado para o usuário.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkinToneDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSkinTone}
              disabled={!stColorName.trim()}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              {editingSkinTone ? 'Salvar Alterações' : 'Criar Tom'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Product Dialog ---- */}
      <Dialog open={productDialogOpen} onOpenChange={(open) => {
        setProductDialogOpen(open);
        if (!open) setEditingProduct(null);
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Altere os dados do produto abaixo.'
                : 'Preencha os dados do novo produto.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nome do produto</Label>
              <Input
                id="product-name"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Base Matte Dourada..."
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={productForm.category}
                onValueChange={(v) => setProductForm(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {catalog.categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        {getIconComponent(cat.icon, 14)}
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-link">Link do produto</Label>
              <Input
                id="product-link"
                value={productForm.link}
                onChange={(e) => setProductForm(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem</Label>
              {productForm.image ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={productForm.image}
                      alt="Preview"
                      className="w-24 h-24 rounded-lg object-cover border border-slate-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setProductForm(prev => ({ ...prev, image: '' }))}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      Remover imagem
                    </Button>
                  </div>
                  <Input
                    value={productForm.image}
                    onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="URL da imagem ou use o upload"
                    className="text-xs"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={productForm.image}
                    onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="https://... (URL da imagem)"
                  />
                  <div className="relative">
                    <input
                      ref={productImageRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <button
                      type="button"
                      onClick={() => productImageRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-200 rounded-lg hover:border-rose-300 hover:bg-rose-50/30 transition-colors cursor-pointer"
                    >
                      <ImagePlus className="size-6 text-slate-400" />
                      <span className="text-xs text-slate-500">Clique para enviar uma imagem (máx. 2MB)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Skin Tones Checklist */}
            <div className="space-y-2">
              <Label>
                Tons de Pele
                <span className="text-slate-400 font-normal ml-1">
                  ({productForm.skinToneIds.length} selecionado{productForm.skinToneIds.length !== 1 ? 's' : ''})
                </span>
              </Label>
              <div className="space-y-1 max-h-[240px] overflow-y-auto rounded-lg border border-slate-200 p-2">
                {catalog.skinTones.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Nenhum tom de pele cadastrado.
                  </p>
                ) : (
                  catalog.skinTones.map((tone) => {
                    const isChecked = productForm.skinToneIds.includes(tone.id);
                    return (
                      <label
                        key={tone.id}
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => {
                            if (editingProduct) {
                              handleToggleProductSkinTone(tone.id);
                            } else {
                              handleToggleNewProductSkinTone(tone.id);
                            }
                          }}
                          className="data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-slate-200 shrink-0 shadow-sm"
                          style={{ backgroundColor: tone.colorHex }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm text-slate-700 truncate block">
                            {tone.colorName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {undertoneLabel[tone.undertone]} · {depthLabel[tone.depth]}
                          </span>
                        </div>
                        {isChecked && (
                          <Check className="size-3.5 text-rose-500 shrink-0" />
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={!productForm.name.trim()}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirmation Dialog ---- */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>&quot;{deleteTarget?.name}&quot;</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget?.type === 'category') handleDeleteCategory();
                else if (deleteTarget?.type === 'skinTone') handleDeleteSkinTone();
                else if (deleteTarget?.type === 'product') handleDeleteProduct();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
