@IsTest
public with sharing class DataExportTest {
    public static testMethod void testCommonHandler() {
        try {
            DataExportCommonHandler dataExportCommonHandler = new DataExportCommonHandler();
            Response response = dataExportCommonHandler.process(new Map<String, Object>{
                    'action' => 'init',
                    'payload' => new Map<String, Object>{
                    },
                    'exportSettingName' => 'TESTT'
            });
        } catch (Exception e) {
            System.assertEquals('No Export Handler Type with Name: ExportTESTTHandler', e.getMessage());
        }
    }

    public static testMethod void testExportService() {
        DataExportService.XMLContent xmlContent = new DataExportService.XMLContent();
        xmlContent.openNode('root')
                .createNode('test', 'test')
                .closeNode('root');

        String csvValue = 'test,';
        csvValue= DataExportService.prepareCSVValue(csvValue);
        System.assertEquals('test;', csvValue);

        String csvValue1 = null;
        csvValue1= DataExportService.prepareCSVValue(csvValue1);
        System.assertEquals('', csvValue1);
    }
}