#ifndef INCLUDE_ONCE_71D92E37_E297_472C_8495_1BF8EA61DC99
#define INCLUDE_ONCE_71D92E37_E297_472C_8495_1BF8EA61DC99

#include <memory>
#include <QOpenGLWidget>
#include <QOpenGLFunctions_3_3_Core>
#include "AtmosphereRenderer.hpp"

class ToolsWidget;
class GLWidget : public QOpenGLWidget, public QOpenGLFunctions_3_3_Core
{
    Q_OBJECT

    std::unique_ptr<AtmosphereRenderer> renderer;
    std::unique_ptr<QOpenGLShaderProgram> luminanceToScreenRGB_;
    QOpenGLTexture bayerPatternTexture_;
    AtmosphereParameters params;
    QString pathToData;
    ToolsWidget* tools;
    GLuint vao_=0, vbo_=0;
    QPoint lastRadianceCapturePosition{-1,-1};

    enum class DragMode
    {
        None,
        Sun,
        Camera,
    } dragMode_=DragMode::None;
    int prevMouseX_, prevMouseY_;

public:
    enum class DitheringMode
    {
        Disabled,    //!< Dithering disabled, will leave the infamous color bands
        Color565,    //!< 16-bit color (AKA High color) with R5_G6_B5 layout
        Color666,    //!< TN+film typical color depth in TrueColor mode
        Color888,    //!< 24-bit color (AKA True color)
        Color101010, //!< 30-bit color (AKA Deep color)
    };

public:
    explicit GLWidget(QString const& pathToData, AtmosphereParameters const& params,
                      ToolsWidget* tools, QWidget* parent=nullptr);
    ~GLWidget();

protected:
    void initializeGL() override;
    void paintGL() override;
    void resizeGL(int w, int h) override;
    void mouseMoveEvent(QMouseEvent* event) override;
    void mousePressEvent(QMouseEvent* event) override;
    void mouseReleaseEvent(QMouseEvent* event) override;

private:
    void setupBuffers();
    void reloadShaders();
    QVector3D rgbMaxValue() const;
    void makeBayerPatternTexture();
    void updateSpectralRadiance(QPoint const& pixelPos);
    void onLoadProgress(QString const& currentActivity, int stepsDone, int stepsToDo);
    void setDragMode(DragMode mode, int x=0, int y=0) { dragMode_=mode; prevMouseX_=x; prevMouseY_=y; }

signals:
    void frameFinished(long long timeInUS);
};

#endif
