public class DataExportService {
    public class XMLContent {
        public String xml = '<?xml version="1.0" encoding="utf-8" ?>\n';

        public XMLContent openNode(String node) {
            this.xml += '<' + node + '>\n';
            return this;
        }

        public XMLContent closeNode(String node) {
            this.xml += '</' + node + '>\n';
            return this;
        }

        public XMLContent createNode(String node, String value) {
            this.xml += '<' + node + '>' + value + '</' + node + '>\n';
            return this;
        }
    }


    public static String prepareCSVValue(Object obj) {
        if (obj == null) {
            return '';
        }
        return String.valueOf(obj).stripHtmlTags().replaceAll('\r\n|\n|\r', ' ').replace(',', ';');
    }
}