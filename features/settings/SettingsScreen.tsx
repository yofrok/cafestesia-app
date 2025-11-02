import React, { useState } from 'react';
import { Provider, Category, Recipe, User } from '../../types';
import { useProviders } from '../../services/useProviders';
import { useCategories } from '../../services/useCategories';
import { useRecipeLog } from '../../services/useRecipeLog';
import Icon from '../../components/Icon';
import ProviderFormModal from './ProviderFormModal';
import CategoryFormModal from './CategoryFormModal';
import { RECIPES } from '../../constants';
import RecipeLogModal from './RecipeLogModal';
import { useUsers } from '../../services/useUsers';
import UserFormModal from './UserFormModal';

interface SettingsScreenProps {
    providersHook: ReturnType<typeof useProviders>;
    categoriesHook: ReturnType<typeof useCategories>;
    recipeLogHook: ReturnType<typeof useRecipeLog>;
    usersHook: ReturnType<typeof useUsers>;
}

type SettingsTab = 'production' | 'inventory' | 'operations';

const SettingsScreen: React.FC<SettingsScreenProps> = ({ providersHook, categoriesHook, recipeLogHook, usersHook }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('operations');

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
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    // User state
    const { users, addUser, updateUser, deleteUser } = usersHook;
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);


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

    const TabButton: React.FC<{ tab: SettingsTab, label: string, icon: 'cake-slice' | 'archive' | 'clipboard-kanban' }> = ({ tab, label, icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 py-3 px-4 text-sm md:text-base font-bold border-b-4 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
            <Icon name={icon} size={18} />
            {label}
        </button>
    );

    return (
        <div className="p-4 md:p-6 bg-gray-50 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="border-b border-gray-200">
                    <div className="flex gap-4">
                        <TabButton tab="production" label="Producción" icon="cake-slice" />
                        <TabButton tab="inventory" label="Inventario" icon="archive" />
                        <TabButton tab="operations" label="Operaciones" icon="clipboard-kanban" />
                    </div>
                </div>

                <div className="mt-6">
                    {activeTab === 'production' && (
                        <section>
                            <h2 className="text-xl font-bold text-blue-700 mb-4">Bitácora de Recetas</h2>
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                <ul className="divide-y divide-gray-200">
                                    {Object.values(RECIPES).map(recipe => (
                                        <li key={recipe.id} className="p-4 flex justify-between items-center">
                                            <span className="font-medium text-gray-800">{recipe.name}</span>
                                            <button 
                                                onClick={() => setSelectedRecipe(recipe)}
                                                className="text-sm text-blue-600 hover:underline font-semibold"
                                            >
                                                Ver Historial
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
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
            {selectedRecipe && (
                <RecipeLogModal
                    isOpen={!!selectedRecipe}
                    onClose={() => setSelectedRecipe(null)}
                    recipe={selectedRecipe}
                    feedbackLog={feedbackLog.filter(f => f.recipeId === selectedRecipe.id)}
                />
            )}
        </div>
    );
};

export default SettingsScreen;
