
import React, { useState } from 'react';
import { Provider, Category, Recipe, User } from '../../types';
import { useProviders } from '../../services/useProviders';
import { useCategories } from '../../services/useCategories';
import { useRecipeLog } from '../../services/useRecipeLog';
import Icon from '../../components/Icon';
import ProviderFormModal from './ProviderFormModal';
import CategoryFormModal from './CategoryFormModal';
import RecipeLogModal from './RecipeLogModal';
import { useUsers } from '../../services/useUsers';
import UserFormModal from './UserFormModal';
import { useRecipes } from '../../services/useRecipes';
import RecipeFormModal from './recipes/RecipeFormModal';
import RoutineManager from './routines/RoutineManager';
import BeverageManager from './beverages/BeverageManager';
import AppDocumentation from './AppDocumentation';
import { useInventory } from '../../services/useInventory';

interface SettingsScreenProps {
    providersHook: ReturnType<typeof useProviders>;
    categoriesHook: ReturnType<typeof useCategories>;
    recipeLogHook: ReturnType<typeof useRecipeLog>;
    usersHook: ReturnType<typeof useUsers>;
    recipesHook: ReturnType<typeof useRecipes>;
    inventoryHook: ReturnType<typeof useInventory>; // Added this
}

type SettingsTab = 'production' | 'inventory' | 'operations' | 'routines' | 'beverages' | 'docs';

const SettingsScreen: React.FC<SettingsScreenProps> = ({ providersHook, categoriesHook, recipeLogHook, usersHook, recipesHook, inventoryHook }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('production');

    // Provider state
    const { providers, addProvider, updateProvider, deleteProvider } = providersHook;
    const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

    // Category state
    const { categories, addCategory, updateCategory, deleteCategory } = categoriesHook;
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Recipe Log state
    const { feedbackLog } = recipeLogHook;
    const [logRecipe, setLogRecipe] = useState<Recipe | null>(null);

    // User state
    const { users, addUser, updateUser, deleteUser } = usersHook;
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Recipe Management State
    const { recipes, addRecipe, updateRecipe, deleteRecipe } = recipesHook;
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    

    const handleEditProvider = (provider: Provider) => {
        setEditingProvider(provider);
        setIsProviderModalOpen(true);
    };

    const handleAddNewProvider = () => {
        setEditingProvider(null);
        setIsProviderModalOpen(true);
    };

    const handleProviderSave = (providerData: Omit<Provider, 'id'> | Provider) => {
        if ('id' in providerData) {
            updateProvider(providerData);
        } else {
            addProvider(providerData);
        }
    };

     const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setIsCategoryModalOpen(true);
    };

    const handleAddNewCategory = () => {
        setEditingCategory(null);
        setIsCategoryModalOpen(true);
    };
    
    const handleCategorySave = (categoryData: Omit<Category, 'id'> | Category) => {
        if ('id' in categoryData) {
            updateCategory(categoryData);
        } else {
            addCategory(categoryData);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleAddNewUser = () => {
        setEditingUser(null);
        setIsUserModalOpen(true);
    };

    const handleUserSave = (userData: Omit<User, 'id'> | User) => {
        if ('id' in userData) {
            updateUser(userData);
        } else {
            addUser(userData);
        }
    };

    const handleEditRecipe = (recipe: Recipe) => {
        setEditingRecipe(recipe);
        setIsRecipeModalOpen(true);
    };

    const handleAddNewRecipe = () => {
        setEditingRecipe(null);
        setIsRecipeModalOpen(true);
    };

    const handleRecipeSave = (recipeData: Omit<Recipe, 'id'>) => {
        if (editingRecipe) {
            updateRecipe({ ...recipeData, id: editingRecipe.id });
        } else {
            addRecipe(recipeData);
        }
    };

    const TabButton: React.FC<{ tab: SettingsTab, label: string, icon: 'cake-slice' | 'archive' | 'clipboard-kanban' | 'list' | 'star' | 'clipboard-list' }> = ({ tab, label, icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 py-3 px-4 text-sm md:text-base font-bold border-b-4 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
            <Icon name={icon} size={18} />
            {label}
        </button>
    );

    // Categorize recipes for display
    const bakingRecipes = recipes.filter(r => r.name.toLowerCase().includes('(horneado)'));
    const doughRecipes = recipes.filter(r => !r.name.toLowerCase().includes('(horneado)'));

    return (
        <div className="p-4 md:p-6 bg-gray-50 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto pb-20">
                <div className="border-b border-gray-200">
                    <div className="flex gap-4 overflow-x-auto">
                        <TabButton tab="production" label="Panadería" icon="cake-slice" />
                        <TabButton tab="beverages" label="Menú/Barra" icon="star" />
                        <TabButton tab="operations" label="Usuarios" icon="clipboard-kanban" />
                        <TabButton tab="routines" label="Rutinas" icon="list" />
                        <TabButton tab="inventory" label="Inventario" icon="archive" />
                        <TabButton tab="docs" label="Info / WDS" icon="clipboard-list" />
                    </div>
                </div>

                <div className="mt-6">
                    {activeTab === 'docs' && <AppDocumentation />}

                    {activeTab === 'production' && (
                         <section className="space-y-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Recetas de Pan</h2>
                                <button onClick={handleAddNewRecipe} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                    <Icon name="plus-circle" size={16} />
                                    Añadir Receta
                                </button>
                            </div>

                            {/* Dough Recipes */}
                            <div>
                                <h3 className="font-bold text-lg text-blue-700 mb-3 flex items-center gap-2">
                                    <span>🥣</span> Elaboración de Masas
                                </h3>
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <ul className="divide-y divide-gray-200">
                                        {doughRecipes.length > 0 ? doughRecipes.map(recipe => (
                                            <li key={recipe.id} className="p-4 flex justify-between items-center">
                                                <span className="font-medium text-gray-800">{recipe.name}</span>
                                                <div className="flex items-center gap-4">
                                                    <button 
                                                        onClick={() => setLogRecipe(recipe)}
                                                        className="text-sm text-gray-500 hover:text-blue-600 hover:underline font-semibold transition-colors"
                                                    >
                                                        Historial
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEditRecipe(recipe)}
                                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                            </li>
                                        )) : (
                                            <li className="p-4 text-gray-400 italic text-sm text-center">No hay recetas de masas configuradas.</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            {/* Baking Recipes */}
                            <div>
                                <h3 className="font-bold text-lg text-orange-700 mb-3 flex items-center gap-2">
                                    <span>🔥</span> Horneado Final
                                </h3>
                                <div className="bg-white rounded-lg border border-orange-200 shadow-sm">
                                    <ul className="divide-y divide-orange-100">
                                        {bakingRecipes.length > 0 ? bakingRecipes.map(recipe => (
                                            <li key={recipe.id} className="p-4 flex justify-between items-center bg-orange-50/30">
                                                {/* Clean up name for display */}
                                                <span className="font-medium text-gray-800">{recipe.name.replace(/\(Horneado\)/i, '').trim()}</span>
                                                <div className="flex items-center gap-4">
                                                    <button 
                                                        onClick={() => setLogRecipe(recipe)}
                                                        className="text-sm text-gray-500 hover:text-blue-600 hover:underline font-semibold transition-colors"
                                                    >
                                                        Historial
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEditRecipe(recipe)}
                                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                            </li>
                                        )) : (
                                            <li className="p-4 text-gray-400 italic text-sm text-center">No hay recetas de horneado configuradas.</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'routines' && (
                        <RoutineManager users={users} />
                    )}

                    {activeTab === 'beverages' && (
                        <BeverageManager inventoryHook={inventoryHook} />
                    )}

                    {activeTab === 'inventory' && (
                        <div className="space-y-8">
                             <section>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-blue-700">Proveedores de Inventario</h2>
                                    <button onClick={handleAddNewProvider} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                        <Icon name="plus-circle" size={16} />
                                        Añadir Proveedor
                                    </button>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <ul className="divide-y divide-gray-200">
                                        {providers.length > 0 ? providers.map(provider => (
                                            <li key={provider.id} className="p-4 flex justify-between items-center">
                                                <span className="font-medium text-gray-800">{provider.name}</span>
                                                <button 
                                                    onClick={() => handleEditProvider(provider)}
                                                    className="text-sm text-blue-600 hover:underline font-semibold"
                                                >
                                                    Editar
                                                </button>
                                            </li>
                                        )) : (
                                            <li className="p-4 text-center text-gray-500">No hay proveedores. ¡Añade el primero!</li>
                                        )}
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-blue-700">Categorías de Inventario</h2>
                                    <button onClick={handleAddNewCategory} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                        <Icon name="plus-circle" size={16} />
                                        Añadir Categoría
                                    </button>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <ul className="divide-y divide-gray-200">
                                        {categories.length > 0 ? categories.map(category => (
                                            <li key={category.id} className="p-4 flex justify-between items-center">
                                                <span className="font-medium text-gray-800">{category.name}</span>
                                                <button 
                                                    onClick={() => handleEditCategory(category)}
                                                    className="text-sm text-blue-600 hover:underline font-semibold"
                                                >
                                                    Editar
                                                </button>
                                            </li>
                                        )) : (
                                            <li className="p-4 text-center text-gray-500">No hay categorías. ¡Añade la primera!</li>
                                        )}
                                    </ul>
                                </div>
                            </section>
                        </div>
                    )}
                    
                    {activeTab === 'operations' && (
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-blue-700">Gestión de Usuarios</h2>
                                <button onClick={handleAddNewUser} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                    <Icon name="plus-circle" size={16} />
                                    Añadir Usuario
                                </button>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                <ul className="divide-y divide-gray-200">
                                    {users.length > 0 ? users.map(user => (
                                        <li key={user.id} className="p-4 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: user.color }}></div>
                                                <span className="font-medium text-gray-800">{user.name}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleEditUser(user)}
                                                className="text-sm text-blue-600 hover:underline font-semibold"
                                            >
                                                Editar
                                            </button>
                                        </li>
                                    )) : (
                                        <li className="p-4 text-center text-gray-500">No hay usuarios. ¡Añade el primero!</li>
                                    )}
                                </ul>
                            </div>
                        </section>
                    )}
                </div>
            </div>

             <ProviderFormModal
                isOpen={isProviderModalOpen}
                onClose={() => setIsProviderModalOpen(false)}
                onSave={handleProviderSave}
                onDelete={deleteProvider}
                provider={editingProvider}
            />
            <CategoryFormModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSave={handleCategorySave}
                onDelete={deleteCategory}
                category={editingCategory}
            />
            <UserFormModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleUserSave}
                onDelete={deleteUser}
                user={editingUser}
            />
             <RecipeFormModal
                isOpen={isRecipeModalOpen}
                onClose={() => setIsRecipeModalOpen(false)}
                onSave={handleRecipeSave}
                onDelete={deleteRecipe}
                recipe={editingRecipe}
            />
            {logRecipe && (
                <RecipeLogModal
                    isOpen={!!logRecipe}
                    onClose={() => setLogRecipe(null)}
                    recipe={logRecipe}
                    feedbackLog={feedbackLog.filter(f => f.recipeId === logRecipe.id)}
                />
            )}
        </div>
    );
};

export default SettingsScreen;
