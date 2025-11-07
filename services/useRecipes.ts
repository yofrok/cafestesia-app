import { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { db } from './firebase';
import * as firestore from 'firebase/firestore';

const recipesCollectionRef = firestore.collection(db, 'recipes');

const INITIAL_RECIPES_DATA: Omit<Recipe, 'id'>[] = [
    {
        name: 'Roles de Canela',
        pluralName: 'Roles de Canela listos',
        setupInstruction: 'Configura el horno a 230°C y programa 16 minutos.',
        baseVariantName: 'Receta Estándar',
        baseVariantDescription: '2 charolas (12 piezas)',
        totalDuration: 0, // Will be calculated
        steps: [
            { duration: 2 * 60, instruction: 'Coloca los roles en los niveles 1 y 3. Deja que el calor eleve el producto sin presionar INICIO.'},
            { duration: 6 * 60, instruction: 'Baja la temperatura a 210°C y comienza el horneado.' },
            { duration: 4 * 60, instruction: 'Gira las charolas 180 grados.' },
            { duration: 2 * 60, instruction: 'Agrega 20 ml de leche y gira cada rol 1/3 de vuelta en sentido contrario del reloj.' },
            { duration: 2 * 60, instruction: 'Vuelve a girar cada rol 1/3 de vuelta para finalizar.' }
        ],
        variants: []
    },
    {
        name: 'Ciabattas',
        pluralName: 'Ciabattas listas',
        setupInstruction: 'Configura el horno a 230°C y programa 30 minutos.',
        baseVariantName: 'Receta Estándar',
        baseVariantDescription: '2 charolas (8 piezas)',
        totalDuration: 0,
        steps: [
            { duration: 2 * 60, instruction: 'Coloca las charolas (niveles 1 y 3) y pulveriza agua 12 veces. Deja que el calor eleve el producto sin presionar INICIO.'},
            { duration: 8 * 60, instruction: 'Baja la temperatura a 210°C y comienza el horneado.' },
            { duration: 8 * 60, instruction: 'Gira las charolas 180 grados y vuelve a pulverizar agua 12 veces.' },
            { duration: 6 * 60, instruction: 'Intercambia las charolas de nivel y da vuelta a cada pieza 180 grados.' },
            { duration: 6 * 60, instruction: 'Gira las charolas 180 grados por última vez.' }
        ],
        variants: []
    },
    {
        name: 'Croissants',
        pluralName: 'Croissants listos',
        setupInstruction: 'Configura el horno a 230°C y programa 21 minutos.',
        baseVariantName: 'Receta Estándar',
        baseVariantDescription: '2 charolas (12-16 piezas)',
        totalDuration: 0,
        steps: [
            { duration: 3 * 60, instruction: 'Coloca las charolas en los niveles 1 y 3. Pulveriza agua 12 veces.' },
            { duration: 6 * 60, instruction: 'Baja la temperatura a 200°C y continua horneando.' },
            { duration: 5 * 60, instruction: 'Gira las charolas 180 grados.' },
            { duration: 5 * 60, instruction: 'Intercambia las charolas de nivel y gíralas 180 grados.' },
            { duration: 2 * 60, instruction: 'Gira las charolas 180 grados por última vez.' }
        ],
        variants: [
             {
                id: 'var-media-charola',
                name: 'Media Charola',
                description: '1 charola (6-8 piezas)',
                stepOverrides: [
                    null, // Step 1 is the same
                    { instruction: 'Baja la temperatura a 180°C y continua horneando.' }, // Step 2 override
                    null,
                    null,
                    null
                ]
            }
        ]
    }
];

const seedInitialData = async () => {
    console.log("Seeding initial recipes to Firestore...");
    const batch = firestore.writeBatch(db);
    INITIAL_RECIPES_DATA.forEach(recipe => {
        const newDocRef = firestore.doc(recipesCollectionRef);
        batch.set(newDocRef, recipe);
    });
    await batch.commit();
    console.log("Initial recipes seeded.");
};

export const useRecipes = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);

    useEffect(() => {
        const q = firestore.query(recipesCollectionRef, firestore.orderBy("name"));
        const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
            if (snapshot.empty && INITIAL_RECIPES_DATA.length > 0) {
                seedInitialData();
                return;
            }
            const recipesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Recipe));
            setRecipes(recipesData);
        }, (error) => {
            console.error("Error fetching recipes:", error);
        });

        return () => unsubscribe();
    }, []);

    const addRecipe = async (recipeData: Omit<Recipe, 'id'>) => {
        try {
            await firestore.addDoc(recipesCollectionRef, recipeData);
        } catch (error) {
            console.error("Error adding recipe:", error);
        }
    };

    const updateRecipe = async (recipeData: Recipe) => {
        const { id, ...data } = recipeData;
        const recipeRef = firestore.doc(db, 'recipes', id);
        try {
            await firestore.updateDoc(recipeRef, data);
        } catch (error) {
            console.error("Error updating recipe:", error);
        }
    };

    const deleteRecipe = async (recipeId: string) => {
        const recipeRef = firestore.doc(db, 'recipes', recipeId);
        try {
            await firestore.deleteDoc(recipeRef);
        } catch (error) {
            console.error("Error deleting recipe:", error);
        }
    };

    return { recipes, addRecipe, updateRecipe, deleteRecipe };
};