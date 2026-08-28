'use client'

import { useState, useTransition, useMemo } from 'react'
import { PiStarFill } from 'react-icons/pi'

import { MediaPicker } from './components/MediaPicker'
import { FeaturedSpeciesManager } from './components/FeaturedSpeciesManager'

import {
  Heading,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  FormField,
  SelectDropdown,
  type SelectOption,
  Input,
  FilterSliceBar,
  type FilterSliceGroup,
  type FilterSliceOption,
} from '@/components'
import { saveShopLayoutConfig, type ShopLayoutConfig } from '@/actions'
import { useToastStore } from '@/store/toast/toast.store'

// ─────────────────────────────────────────────────────────────
// Tipos e Interfaces
// ─────────────────────────────────────────────────────────────

interface SpeciesItem {
  id: string
  name: string
  slug: string
  images: string[]
  genus: {
    name: string
    type: string
  }
}

interface ShopViewProps {
  initialData: SpeciesItem[]
  initialLayoutConfig: ShopLayoutConfig
}

const PLANT_TYPE_LABELS: Record<string, string> = {
  ORCHID: 'Orquídea',
  CACTUS: 'Cactus',
  SUCCULENT: 'Suculenta',
  ADENIUM_OBESUM: 'Rosa del Desierto',
  BROMELIAD: 'Bromelia',
}

// ─────────────────────────────────────────────────────────────
// Subcomponente: Cascada de Selección
// ─────────────────────────────────────────────────────────────

interface SpeciesSelectorCascadeProps {
  allSpecies: SpeciesItem[]
  selectedSpeciesId: string
  fixedType?: string
  onChange: (speciesId: string, imageUrl: string, slug: string) => void
}

function SpeciesSelectorCascade({
  allSpecies,
  selectedSpeciesId,
  fixedType,
  onChange,
}: SpeciesSelectorCascadeProps) {
  const currentSpecies = useMemo(() => {
    return allSpecies.find((s) => s.id === selectedSpeciesId)
  }, [allSpecies, selectedSpeciesId])

  const [prevSpeciesId, setPrevSpeciesId] = useState(selectedSpeciesId)
  const [localType, setLocalType] = useState<string>(currentSpecies?.genus.type || fixedType || '')
  const [genusName, setGenusName] = useState<string>(currentSpecies?.genus.name || '')

  if (selectedSpeciesId !== prevSpeciesId) {
    setPrevSpeciesId(selectedSpeciesId)
    if (currentSpecies) {
      if (!fixedType) setLocalType(currentSpecies.genus.type)
      setGenusName(currentSpecies.genus.name)
    }
  }

  const activeType = fixedType || localType

  // Opciones de tipos de planta
  const plantTypeOptions: SelectOption[] = useMemo(() => {
    return Object.entries(PLANT_TYPE_LABELS).map(([k, v]) => ({
      label: v,
      value: k,
    }))
  }, [])

  // Géneros disponibles filtrados por Tipo
  const availableGenera = useMemo(() => {
    if (!activeType) return []
    const set = new Set<string>()

    allSpecies.forEach((s) => {
      if (s.genus.type === activeType) {
        set.add(s.genus.name)
      }
    })

    return Array.from(set).sort()
  }, [allSpecies, activeType])

  const genusOptions: SelectOption[] = useMemo(() => {
    return availableGenera.map((g) => ({
      label: g,
      value: g,
    }))
  }, [availableGenera])

  // Especies disponibles filtradas por Género
  const availableSpecies = useMemo(() => {
    if (!genusName || !activeType) return []

    return allSpecies.filter((s) => s.genus.type === activeType && s.genus.name === genusName)
  }, [allSpecies, activeType, genusName])

  const speciesOptions: SelectOption[] = useMemo(() => {
    return availableSpecies.map((s) => ({
      label: s.name,
      value: s.id,
    }))
  }, [availableSpecies])

  const handleTypeChange = (newType: string) => {
    setLocalType(newType)
    setGenusName('')
  }

  const handleGenusChange = (newGenus: string) => {
    setGenusName(newGenus)
  }

  const handleSpeciesChange = (speciesId: string) => {
    const spec = allSpecies.find((s) => s.id === speciesId)

    if (spec) {
      onChange(speciesId, spec.images[0] || '', spec.slug)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {!fixedType && (
        <FormField htmlFor="plant-type-select" label="Tipo de Planta">
          <SelectDropdown
            id="plant-type-select"
            options={plantTypeOptions}
            placeholder="Seleccionar Tipo"
            value={localType}
            onChange={(val) => handleTypeChange(String(val))}
          />
        </FormField>
      )}

      <FormField htmlFor="genus-select" label="Género">
        <SelectDropdown
          disabled={!activeType}
          emptyMessage="Selecciona un tipo primero"
          id="genus-select"
          options={genusOptions}
          placeholder="Seleccionar Género"
          value={genusName}
          onChange={(val) => handleGenusChange(String(val))}
        />
      </FormField>

      <FormField htmlFor="species-select" label="Especie">
        <SelectDropdown
          disabled={!genusName}
          emptyMessage="Selecciona un género primero"
          id="species-select"
          options={speciesOptions}
          placeholder="Seleccionar Especie"
          value={selectedSpeciesId}
          onChange={(val) => handleSpeciesChange(String(val))}
        />
      </FormField>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────────────────────

type TabType = 'hero' | 'featured' | 'categories' | 'navbar'

const SECTION_OPTIONS: FilterSliceOption[] = [
  { id: 'hero', label: 'Hero Sliders' },
  { id: 'featured', label: 'Destacadas' },
  { id: 'categories', label: 'Categorías' },
  { id: 'navbar', label: 'Navbar' },
]

export function ShopView({ initialData, initialLayoutConfig }: ShopViewProps) {
  const [config, setConfig] = useState<ShopLayoutConfig>(initialLayoutConfig)
  const [activeTab, setActiveTab] = useState<TabType>('hero')

  const { addToast } = useToastStore()
  const [isPending, startTransition] = useTransition()

  const sectionGroups: FilterSliceGroup[] = useMemo(
    () => [
      {
        id: 'shop-sections',
        options: SECTION_OPTIONS,
        value: activeTab,
        onChange: (val) => setActiveTab(val as TabType),
        ariaLabel: 'Secciones de la tienda',
      },
    ],
    [activeTab],
  )

  // Guardar configuración completa en base de datos
  const handleSaveAll = () => {
    startTransition(async () => {
      const result = await saveShopLayoutConfig(config)

      if (result.ok) {
        addToast('Configuración estética guardada con éxito.', 'success')
      } else {
        addToast(result.message ?? 'Error al guardar la configuración.', 'error')
      }
    })
  }

  // Helper para buscar imágenes de una especie seleccionada
  const getSpeciesImages = (speciesId: string) => {
    const spec = initialData.find((s) => s.id === speciesId)

    return spec ? spec.images : []
  }

  return (
    <div className="mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <Heading
          description="Estilo, imágenes R2 de categorías, sliders principales y destacados de la landing page."
          title="Curaduría Estética de la Tienda"
        />
        <Button
          className="self-start font-bold shadow-lg shadow-emerald-500/10 md:self-auto"
          isLoading={isPending}
          onClick={handleSaveAll}
        >
          Guardar Configuración
        </Button>
      </div>

      {/* Selector de Secciones */}
      <div className="w-full">
        <FilterSliceBar
          activeVariant="surface"
          ariaLabel="Navegación de secciones de la tienda"
          className="w-full"
          groups={sectionGroups}
          rounded="md"
        />
      </div>

      {/* Contenidos */}
      <div className="flex flex-col gap-6">
        {/* Pestaña: Destacados */}
        {activeTab === 'featured' && (
          <Card className="bg-canvas border-input-outline overflow-hidden">
            <CardHeader className="bg-surface/50 border-input-outline border-b px-6 py-5">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <PiStarFill className="text-yellow-500" />
                Los 9 Más Vendidos / Destacados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <FeaturedSpeciesManager
                allSpecies={initialData}
                featuredIds={config.featuredSpeciesIds}
                onChange={(newIds) =>
                  setConfig((prev) => ({ ...prev, featuredSpeciesIds: newIds }))
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Pestaña: Hero Slider */}
        {activeTab === 'hero' && (
          <div className="flex flex-col gap-6">
            <div className="text-secondary text-sm italic">
              Configura las 4 especies destacadas del Hero de la landing page. Debe haber 1 por cada
              tipo de planta principal.
            </div>

            {config.heroSlides.map((slide, index) => {
              const types = ['ORCHID', 'CACTUS', 'SUCCULENT', 'ADENIUM_OBESUM']
              const fixedType = types[index] || undefined
              const typeLabel = fixedType ? PLANT_TYPE_LABELS[fixedType] : `Slide ${index + 1}`

              return (
                <Card
                  key={fixedType || index}
                  className="bg-canvas border-input-outline overflow-hidden"
                >
                  <CardHeader className="bg-surface/50 border-input-outline border-b px-6 py-4">
                    <CardTitle className="flex items-center gap-2 text-base font-bold">
                      Slide {index + 1}: {typeLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 p-6">
                    {/* Cascada de especies */}
                    <SpeciesSelectorCascade
                      allSpecies={initialData}
                      fixedType={fixedType}
                      selectedSpeciesId={slide.speciesId}
                      onChange={(speciesId, imgUrl, slug) => {
                        setConfig((prev) => {
                          const slides = [...prev.heroSlides]

                          slides[index] = {
                            ...slides[index],
                            speciesId,
                            imageUrl: imgUrl,
                            slug,
                          }

                          return { ...prev, heroSlides: slides }
                        })
                      }}
                    />

                    {/* Título Personalizado */}
                    <FormField htmlFor={`hero-title-${index}`} label="Título en el Hero">
                      <Input
                        id={`hero-title-${index}`}
                        placeholder="Ej: Cattleya Maxima"
                        type="text"
                        value={slide.title}
                        onChange={(e) => {
                          const val = e.target.value

                          setConfig((prev) => {
                            const slides = [...prev.heroSlides]

                            slides[index] = { ...slides[index], title: val }

                            return { ...prev, heroSlides: slides }
                          })
                        }}
                      />
                    </FormField>

                    {/* Media Picker */}
                    {slide.speciesId && (
                      <div className="border-input-outline border-t pt-4">
                        <MediaPicker
                          aspectRatio="hero"
                          images={getSpeciesImages(slide.speciesId)}
                          selectedImage={slide.imageUrl}
                          onSelect={(url) => {
                            setConfig((prev) => {
                              const slides = [...prev.heroSlides]

                              slides[index] = { ...slides[index], imageUrl: url }

                              return { ...prev, heroSlides: slides }
                            })
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pestaña: Categorías */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Object.entries(config.categories).map(([key, cat]) => {
              const catKey = key as keyof typeof config.categories
              let fixedType = ''
              let label = ''
              let defaultTitle = ''
              let defaultSubtitle = ''

              if (catKey === 'orchids') {
                fixedType = 'ORCHID'
                label = 'Orquídeas'
                defaultTitle = 'Orquídeas de Colección'
                defaultSubtitle = 'Cultivadas y aclimatadas al clima de Ciudad Guayana'
              } else if (catKey === 'cactus') {
                fixedType = 'CACTUS'
                label = 'Cactus'
                defaultTitle = 'Cactus'
                defaultSubtitle = 'Especies exóticas de colección y bajo mantenimiento'
              } else if (catKey === 'succulents') {
                fixedType = 'SUCCULENT'
                label = 'Suculentas'
                defaultTitle = 'Suculentas'
                defaultSubtitle = 'Geometrías botánicas y colores extraordinarios'
              } else if (catKey === 'adenium_obesum') {
                fixedType = 'ADENIUM_OBESUM'
                label = 'Rosas del Desierto'
                defaultTitle = 'Rosas del Desierto'
                defaultSubtitle = 'Bonsáis naturales de floración extraordinaria'
              }

              // Buscar especie activa priorizando speciesId, luego fallback a imágenes
              const matchingSpecies = cat.speciesId
                ? initialData.find((s) => s.id === cat.speciesId)
                : initialData.find((s) => s.images.includes(cat.imageUrl))
              const activeSpeciesId = cat.speciesId || matchingSpecies?.id || ''

              return (
                <Card key={catKey} className="bg-canvas border-input-outline overflow-hidden">
                  <CardHeader className="bg-surface/50 border-input-outline border-b px-6 py-4">
                    <CardTitle className="text-base font-bold">Categoría: {label}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 p-6">
                    {/* Cascada para buscar especie de este tipo */}
                    <SpeciesSelectorCascade
                      allSpecies={initialData}
                      fixedType={fixedType}
                      selectedSpeciesId={activeSpeciesId}
                      onChange={(speciesId, imgUrl) => {
                        setConfig((prev) => ({
                          ...prev,
                          categories: {
                            ...prev.categories,
                            [catKey]: {
                              ...prev.categories[catKey],
                              speciesId,
                              imageUrl: imgUrl || prev.categories[catKey].imageUrl,
                            },
                          },
                        }))
                      }}
                    />

                    {/* Inputs de Título y Subtítulo en Landing */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField htmlFor={`category-title-${catKey}`} label="Título en Landing">
                        <Input
                          id={`category-title-${catKey}`}
                          placeholder={defaultTitle}
                          type="text"
                          value={cat.title ?? ''}
                          onChange={(e) => {
                            const val = e.target.value

                            setConfig((prev) => ({
                              ...prev,
                              categories: {
                                ...prev.categories,
                                [catKey]: {
                                  ...prev.categories[catKey],
                                  title: val,
                                },
                              },
                            }))
                          }}
                        />
                      </FormField>

                      <FormField
                        htmlFor={`category-subtitle-${catKey}`}
                        label="Subtítulo en Landing"
                      >
                        <Input
                          id={`category-subtitle-${catKey}`}
                          placeholder={defaultSubtitle}
                          type="text"
                          value={cat.subtitle ?? ''}
                          onChange={(e) => {
                            const val = e.target.value

                            setConfig((prev) => ({
                              ...prev,
                              categories: {
                                ...prev.categories,
                                [catKey]: {
                                  ...prev.categories[catKey],
                                  subtitle: val,
                                },
                              },
                            }))
                          }}
                        />
                      </FormField>
                    </div>

                    {/* Media Picker */}
                    {activeSpeciesId && (
                      <div className="border-input-outline border-t pt-4">
                        <MediaPicker
                          aspectRatio="category"
                          images={getSpeciesImages(activeSpeciesId)}
                          selectedImage={cat.imageUrl}
                          onSelect={(url) => {
                            setConfig((prev) => ({
                              ...prev,
                              categories: {
                                ...prev.categories,
                                [catKey]: {
                                  ...prev.categories[catKey],
                                  imageUrl: url,
                                },
                              },
                            }))
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pestaña: Navbar / Megamenú */}
        {activeTab === 'navbar' && (
          <Card className="bg-canvas border-input-outline overflow-hidden">
            <CardHeader className="bg-surface/50 border-input-outline border-b px-6 py-5">
              <CardTitle className="text-xl font-bold">
                Producto Destacado en Menú de Navegación (Header)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="text-secondary mb-2 text-sm italic">
                Asigna el producto especial que aparece con banner destacado dentro del megamenú
                desplegable del Header.
              </div>

              {/* Cascada de especies */}
              <SpeciesSelectorCascade
                allSpecies={initialData}
                selectedSpeciesId={config.megamenu.featuredItem.speciesId}
                onChange={(speciesId, imgUrl, slug) => {
                  setConfig((prev) => ({
                    ...prev,
                    megamenu: {
                      featuredItem: {
                        ...prev.megamenu.featuredItem,
                        speciesId,
                        imageUrl: imgUrl,
                        slug,
                      },
                    },
                  }))
                }}
              />

              {/* Título en megamenú */}
              <FormField htmlFor="megamenu-title-input" label="Título del Megamenú">
                <Input
                  id="megamenu-title-input"
                  placeholder="Ej: Dendrobium Striata"
                  type="text"
                  value={config.megamenu.featuredItem.title}
                  onChange={(e) => {
                    const val = e.target.value

                    setConfig((prev) => ({
                      ...prev,
                      megamenu: {
                        featuredItem: {
                          ...prev.megamenu.featuredItem,
                          title: val,
                        },
                      },
                    }))
                  }}
                />
              </FormField>

              {/* Media Picker */}
              {config.megamenu.featuredItem.speciesId && (
                <div className="border-input-outline border-t pt-4">
                  <MediaPicker
                    aspectRatio="square"
                    images={getSpeciesImages(config.megamenu.featuredItem.speciesId)}
                    selectedImage={config.megamenu.featuredItem.imageUrl}
                    onSelect={(url) => {
                      setConfig((prev) => ({
                        ...prev,
                        megamenu: {
                          featuredItem: {
                            ...prev.megamenu.featuredItem,
                            imageUrl: url,
                          },
                        },
                      }))
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
