
import { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { db } from './firebase';
import * as firestore from 'firebase/firestore';

const recipesCollectionRef = firestore.collection(db, 'recipes');

const INITIAL_RECIPES_DATA: Omit<Recipe, 'id'>[] = [
    {
        name: 'Roles de Canela (Horneado)',
        pluralName: 'Roles de Canela listos',
        setupInstruction: 'Configura el horno a 230°C y programa 16 minutos.',
        baseVariantName: 'Receta Estándar',
        baseVariantDescription: '2 charolas (12 piezas)',
        totalDuration: 0, // Will be calculated
        steps: [
            { duration: 2 * 60, instruction: 'Coloca los roles en los niveles 1 y 3. Deja que el calor eleve el producto sin presionar INICIO.', type: 'passive'},
            { duration: 6 * 60, instruction: 'Baja la temperatura a 210°C y comienza el horneado.', type: 'passive' },
            { duration: 4 * 60, instruction: 'Gira las charolas 180 grados.', type: 'passive' }, // The duration implies baking time after turning
            { duration: 2 * 60, instruction: 'Agrega 20 ml de leche y gira cada rol 1/3 de vuelta en sentido contrario del reloj.', type: 'active' },
            { duration: 2 * 60, instruction: 'Vuelve a girar cada rol 1/3 de vuelta para finalizar.', type: 'passive' }
        ],
        variants: []
    },
    {
        name: 'Ciabattas (Horneado)',
        pluralName: 'Ciabattas listas',
        setupInstruction: 'Configura el horno a 230°C y programa 30 minutos.',
        baseVariantName: 'Receta Estándar',
        baseVariantDescription: '2 charolas (8 piezas)',
        totalDuration: 0,
        steps: [
            { duration: 2 * 60, instruction: 'Coloca las charolas (niveles 1 y 3) y pulveriza agua 12 veces. Deja que el calor eleve el producto sin presionar INICIO.', type: 'passive'},
            { duration: 8 * 60, instruction: 'Baja la temperatura a 210°C y comienza el horneado.', type: 'passive' },
            { duration: 8 * 60, instruction: 'Gira las charolas 180 grados y vuelve a pulverizar agua 12 veces.', type: 'passive' },
            { duration: 6 * 60, instruction: 'Intercambia las charolas de nivel y da vuelta a cada pieza 180 grados.', type: 'passive' },
            { duration: 6 * 60, instruction: 'Gira las charolas 180 grados por última vez.', type: 'passive' }
        ],
        variants: []
    },
    {
        name: 'Croissants (Horneado)',
        pluralName: 'Croissants listos',
        setupInstruction: 'Configura el horno a 230°C y programa 21 minutos.',
        baseVariantName: 'Receta Estándar',
        baseVariantDescription: '2 charolas (12-16 piezas)',
        totalDuration: 0,
        steps: [
            { duration: 3 * 60, instruction: 'Coloca las charolas en los niveles 1 y 3. Pulveriza agua 12 veces.', type: 'passive' },
            { duration: 6 * 60, instruction: 'Baja la temperatura a 200°C y continua horneando.', type: 'passive' },
            { duration: 5 * 60, instruction: 'Gira las charolas 180 grados.', type: 'passive' },
            { duration: 5 * 60, instruction: 'Intercambia las charolas de nivel y gíralas 180 grados.', type: 'passive' },
            { duration: 2 * 60, instruction: 'Gira las charolas 180 grados por última vez.', type: 'passive' }
        ],
        variants: [
             {
                id: 'var-media-charola',
                name: 'Media Charola',
                description: '1 charola (6-8 piezas)',
                stepOverrides: [
                    null, // Step 1 is the same
                    { instruction: 'Baja la temperatura a 180°C y continua horneando.', type: 'passive' }, // Step 2 override
                    null,
                    null,
                    null
                ]
            }
        ]
    },
     {
        name: 'Masa de Croissants (Proceso Completo)',
        pluralName: 'Masa lista',
        setupInstruction: 'Tener mantequilla fría y laminadora lista.',
        baseVariantName: 'Lote Completo',
        baseVariantDescription: '22-24 piezas',
        totalDuration: 0,
        steps: [
            { duration: 15 * 60, instruction: 'Mezclar ingredientes y amasar (fase 1).', type: 'active' },
            { duration: 60 * 60, instruction: 'Primera fermentación / descanso en frío.', type: 'passive' },
            { duration: 20 * 60, instruction: 'Laminar mantequilla y dar vueltas (simple y doble).', type: 'active' },
            { duration: 45 * 60, instruction: 'Descanso en frío antes de formar.', type: 'passive' },
            { duration: 30 * 60, instruction: 'Estirar, cortar triángulos y formar.', type: 'active' }
        ],
        variants: []
    },
    {
        name: 'Galletas (Cookies)',
        pluralName: 'Galletas listas',
        setupInstruction: 'Precalentar horno a 170°C. Preparar charolas con papel estrella.',
        baseVariantName: 'Lote Estándar',
        baseVariantDescription: '20-24 galletas',
        totalDuration: 0,
        steps: [
            { duration: 10 * 60, instruction: 'Acremar mantequilla y azúcares.', type: 'active' },
            { duration: 5 * 60, instruction: 'Incorporar huevos y vainilla, luego secos y chocolate.', type: 'active' },
            { duration: 15 * 60, instruction: 'Porcionar masa (bolear) y colocar en charolas.', type: 'active' },
            { duration: 20 * 60, instruction: 'Congelar las bolas de masa (mejora textura).', type: 'passive' },
            { duration: 12 * 60, instruction: 'Hornear a 170°C.', type: 'passive' },
            { duration: 10 * 60, instruction: 'Dejar enfriar en charola antes de mover.', type: 'passive' }
        ],
        variants: []
    },
    {
        name: 'Masa para Pizza',
        pluralName: 'Masa de Pizza lista',
        setupInstruction: 'Tener harina de fuerza lista y agua fría.',
        baseVariantName: 'Lote 4kg',
        baseVariantDescription: 'Aprox 15 pizzas',
        totalDuration: 0,
        steps: [
            { duration: 15 * 60, instruction: 'Mezclado y amasado hasta desarrollo de gluten.', type: 'active' },
            { duration: 2 * 60 * 60, instruction: 'Fermentación en bloque (tapar bien).', type: 'passive' },
            { duration: 20 * 60, instruction: 'Dividir, pesar y bolear porciones.', type: 'active' },
            { duration: 24 * 60 * 60, instruction: 'Maduración en refrigeración (24 a 48 horas).', type: 'passive' }
        ],
        variants: []
    }
];

const checkAndSeedMissingRecipes = async () => {
    try {
        const snapshot = await firestore.getDocs(recipesCollectionRef);
        const existingNames = new Set(snapshot.docs.map(d => d.data().name));
        
        const batch = firestore.writeBatch(db);
        let hasUpdates = false;
        
        INITIAL_RECIPES_DATA.forEach(recipe => {
            if (!existingNames.has(recipe.name)) {
                console.log(`Seeding missing recipe: ${recipe.name}`);
                const newDocRef = firestore.doc(recipesCollectionRef);
                batch.set(newDocRef, recipe);
                hasUpdates = true;
            }
        });
        
        if (hasUpdates) {
            await batch.commit();
            console.log("New recipes added to database.");
        }
    } catch (error) {
        console.error("Error checking/seeding recipes:", error);
    }
};

export const useRecipes = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);

    useEffect(() => {
        // Perform smart seeding check on mount
        checkAndSeedMissingRecipes();

        const q = firestore.query(recipesCollectionRef, firestore.orderBy("name"));
        const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
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
