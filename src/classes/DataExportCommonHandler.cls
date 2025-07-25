public class DataExportCommonHandler extends AbstractProcessor {

    public override Response process(Request request) {
        this.request = request;

        String exportSettingName = this.request.getRequiredString('exportSettingName');
        DataExportAbstractHandler exportHandler = createExportHandler(exportSettingName);

        exportHandler.exportSettingName = exportSettingName;
        exportHandler.payload = new DTO((Map<String, Object>) this.request.get('payload'));

        this.response = exportHandler.process(this.request);
        this.response.put('payload', exportHandler.payload.getMap());

        return this.response;
    }

    private static DataExportAbstractHandler createExportHandler(String exportSettingName) {
        String className = 'Export' + exportSettingName + 'Handler';
        Type exportHandlerType = Type.forName(className);

        if (exportHandlerType == null) {
            throw new Structs.CommonException('No Export Handler Type with Name: ' + className);
        }

        DataExportAbstractHandler handler = (DataExportAbstractHandler) exportHandlerType.newInstance();

        if (handler == null) {
            throw new Structs.CommonException('Unable to create Export Handler instance of type name: ' + className);
        }

        return handler;
    }
}