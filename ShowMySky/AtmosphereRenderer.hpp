#ifndef INCLUDE_ONCE_5DB905D2_61C0_44DB_8F35_67B31BD78315
#define INCLUDE_ONCE_5DB905D2_61C0_44DB_8F35_67B31BD78315

#include <cmath>
#include <array>
#include <deque>
#include <memory>
#include <glm/glm.hpp>
#include <QObject>
#include <QOpenGLTexture>
#include <QOpenGLShaderProgram>
#include <QOpenGLFunctions_3_3_Core>
#include "../common/types.hpp"
#include "../common/AtmosphereParameters.hpp"
#include "api/AtmosphereRenderer.hpp"

class AtmosphereRenderer : public ShowMySky::AtmosphereRenderer
{
    using ShaderProgPtr=std::unique_ptr<QOpenGLShaderProgram>;
    using TexturePtr=std::unique_ptr<QOpenGLTexture>;
    using ScattererName=QString;
    QOpenGLFunctions_3_3_Core& gl;
public:

    AtmosphereRenderer(QOpenGLFunctions_3_3_Core& gl,
                       QString const& pathToData,
                       ShowMySky::Settings* tools,
                       std::function<void(QOpenGLShaderProgram&)> const& drawSurface);
    AtmosphereRenderer(AtmosphereRenderer const&)=delete;
    AtmosphereRenderer(AtmosphereRenderer&&)=delete;
    ~AtmosphereRenderer();
    void setDrawSurfaceCallback(std::function<void(QOpenGLShaderProgram&)> const& drawSurface) override;
    int initDataLoading(QByteArray viewDirVertShaderSrc, QByteArray viewDirFragShaderSrc,
                        std::vector<std::pair<std::string,GLuint>> viewDirBindAttribLocations) override;
    LoadingStatus stepDataLoading();
    int initPreparationToDraw() override;
    LoadingStatus stepPreparationToDraw() override;
    QString currentActivity() const override { return currentActivity_; }
    bool isLoading() const override { return totalLoadingStepsToDo_ > 0; }
    bool isReadyToRender() const override { return state_ == State::ReadyToRender; }
    bool canGrabRadiance() const override;
    bool canSetSolarSpectrum() const override;
    bool canRenderPrecomputedEclipsedDoubleScattering() const override;
    GLuint getLuminanceTexture() override { return luminanceRenderTargetTexture_.textureId(); };

    void draw(double brightness, bool clear) override;
    void resizeEvent(int width, int height) override;
    QVector4D getPixelLuminance(QPoint const& pixelPos) override;
    SpectralRadiance getPixelSpectralRadiance(QPoint const& pixelPos) override;
    std::vector<float> getWavelengths() override;
    void setSolarSpectrum(std::vector<float> const& solarIrradianceAtTOA) override;
    void resetSolarSpectrum() override;
    Direction getViewDirection(QPoint const& pixelPos) override;

    void setScattererEnabled(QString const& name, bool enable) override;
    int initShaderReloading() override;
    LoadingStatus stepShaderReloading() override;
    AtmosphereParameters const& atmosphereParameters() const { return params_; }

private: // variables
    ShowMySky::Settings* tools_;
    std::function<void(QOpenGLShaderProgram&)> drawSurfaceCallback;
    AtmosphereParameters params_;
    QString pathToData_;
    int totalLoadingStepsToDo_=-1, loadingStepsDone_=0, currentLoadingIterationStepCounter_=0;
    QString currentActivity_;

    QByteArray viewDirVertShaderSrc_, viewDirFragShaderSrc_;
    std::vector<std::pair<std::string,GLuint>> viewDirBindAttribLocations_;

    GLuint vao_=0, vbo_=0, luminanceRadianceFBO_=0, viewDirectionFBO_=0;
    GLuint eclipseSingleScatteringPrecomputationFBO_=0;
    GLuint eclipseDoubleScatteringPrecomputationFBO_=0;
    // Lower and upper altitude slices from the 4D texture
    std::vector<TexturePtr> eclipsedDoubleScatteringTexturesLower_, eclipsedDoubleScatteringTexturesUpper_;
    std::vector<TexturePtr> multipleScatteringTextures_;
    std::vector<TexturePtr> transmittanceTextures_;
    std::vector<TexturePtr> irradianceTextures_;
    std::vector<TexturePtr> lightPollutionTextures_;
    std::vector<GLuint> radianceRenderBuffers_;
    GLuint viewDirectionRenderBuffer_=0;
    // Indexed as singleScatteringTextures_[scattererName][wavelengthSetIndex]
    std::map<ScattererName,std::vector<TexturePtr>> singleScatteringTextures_;
    std::map<ScattererName,std::vector<TexturePtr>> eclipsedSingleScatteringPrecomputationTextures_;
    TexturePtr eclipsedDoubleScatteringPrecomputationScratchTexture_;
    std::vector<TexturePtr> eclipsedDoubleScatteringPrecomputationTargetTextures_;
    QOpenGLTexture luminanceRenderTargetTexture_;
    QSize viewportSize_;
    double altCoordToLoad_=0; //!< Used to load textures for a single altitude slice, even if input altitude changes during the load
    float loadedAltitudeURTexCoordRange_[2]={NAN,NAN};
    float loadedEclipsedDoubleScatteringAltitudeURTexCoordRange_[2]={NAN,NAN};
    float staticAltitudeTexCoord_=-1;
    float eclipsedDoubleScatteringAltitudeAlphaUpper_=-1;

    std::vector<ShaderProgPtr> lightPollutionPrograms_;
    std::vector<ShaderProgPtr> zeroOrderScatteringPrograms_;
    std::vector<ShaderProgPtr> eclipsedZeroOrderScatteringPrograms_;
    std::vector<ShaderProgPtr> multipleScatteringPrograms_;
    // Indexed as singleScatteringPrograms_[renderMode][scattererName][wavelengthSetIndex]
    using ScatteringProgramsMap=std::map<ScattererName,std::vector<ShaderProgPtr>>;
    std::vector<std::unique_ptr<ScatteringProgramsMap>> singleScatteringPrograms_;
    std::vector<std::unique_ptr<ScatteringProgramsMap>> eclipsedSingleScatteringPrograms_;
    std::vector<ShaderProgPtr> eclipsedDoubleScatteringPrecomputedPrograms_;
    std::vector<ShaderProgPtr> eclipsedDoubleScatteringPrecomputationPrograms_;
    // Indexed as eclipsedSingleScatteringPrecomputationPrograms_[scattererName][wavelengthSetIndex]
    std::unique_ptr<ScatteringProgramsMap> eclipsedSingleScatteringPrecomputationPrograms_;
    std::unique_ptr<QOpenGLShader> precomputationProgramsVertShader_;
    std::unique_ptr<QOpenGLShader> viewDirVertShader_, viewDirFragShader_;
    ShaderProgPtr viewDirectionGetterProgram_;
    std::map<ScattererName,bool> scatterersEnabledStates_;

    std::vector<QVector4D> solarIrradianceFixup_;

    int numAltIntervalsIn4DTexture_;
    int numAltIntervalsInEclipsed4DTexture_;

    enum class State
    {
        NotReady,           //!< Just constructed or failed to load data
        LoadingData,        //!< After initDataLoading() and until loading completes
        ReloadingShaders,   //!< After initShaderReloading() and until shaders reloading completes
        ReloadingTextures,  //!< After initPreparationToDraw() and until textures reloading completes
        ReadyToRender,
    } state_ = State::NotReady;

private: // methods
    DEFINE_EXPLICIT_BOOL(CountStepsOnly);
    void loadTextures(CountStepsOnly countStepsOnly);
    void reloadScatteringTextures(CountStepsOnly countStepsOnly);
    void setupRenderTarget();
    void loadShaders(CountStepsOnly countStepsOnly);
    void setupBuffers();
    void clearResources();
    void finalizeLoading();
    void drawSurface(QOpenGLShaderProgram& prog);

    double altitudeUnitRangeTexCoord() const;
    double cameraMoonDistance() const;
    glm::dvec3 sunDirection() const;
    glm::dvec3 moonPosition() const;
    glm::dvec3 moonPositionRelativeToSunAzimuth() const;
    glm::dvec3 cameraPosition() const;
    glm::ivec2 loadTexture2D(QString const& path);
    void loadTexture4D(QString const& path, float altitudeCoord);
    void load4DTexAltitudeSlicePair(QString const& path, QOpenGLTexture& texLower, QOpenGLTexture& texUpper, float altitudeCoord);
    void updateAltitudeTexCoords(float altitudeCoord, double* floorAltIndex = nullptr);
    void updateEclipsedAltitudeTexCoords(float altitudeCoord, double* floorAltIndex = nullptr);

    void precomputeEclipsedSingleScattering();
    void precomputeEclipsedDoubleScattering();
    void renderZeroOrderScattering();
    void renderSingleScattering();
    void renderMultipleScattering();
    void renderLightPollution();
    void prepareRadianceFrames(bool clear);
};

#endif
